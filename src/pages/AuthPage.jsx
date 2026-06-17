import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { createProfile, getUserByUsername } from '../lib/data'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const existing = await getUserByUsername(username)
        if (existing) throw new Error('Username gia in uso.')
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await createProfile(credential.user, username)
        setMessage('Account creato.')
      }
    } catch (error) {
      const rawMessage = error.message || ''
      if (rawMessage.toLowerCase().includes('client is offline')) {
        setMessage('Database Neon non raggiungibile. Controlla DATABASE_URL e riavvia.')
      } else {
        setMessage(rawMessage || 'Accesso non riuscito.')
      }
    }

    setLoading(false)
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <h1>BetTracker</h1>
        <p>Accedi alla tua dashboard personale.</p>
        <form onSubmit={submit}>
          {!isLogin && <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" minLength="6" required />
          <button disabled={loading}>{loading ? 'Attendi...' : isLogin ? 'Accedi' : 'Registrati'}</button>
        </form>
        {message && <p className="form-message">{message}</p>}
        <button className="link-button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Crea un account' : 'Ho gia un account'}
        </button>
      </section>
    </main>
  )
}
