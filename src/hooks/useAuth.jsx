import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { createProfile, getProfile } from '../lib/data'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(currentUser) {
    try {
      const data = await getProfile(currentUser.uid)
      if (data) {
        setProfile(data)
        return
      }

      const created = await createProfile(currentUser, currentUser.email?.split('@')[0] || 'utente')
      setProfile(created)
    } catch (_error) {
      setProfile(null)
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser)
      if (currentUser?.uid) {
        await loadProfile(currentUser)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    configMissing: !isFirebaseConfigured,
    signOut: () => signOut(auth),
    reloadProfile: () => user?.uid && loadProfile(user)
  }), [user, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
