import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import AddSchedina from './pages/AddSchedina'
import StatistichePage from './pages/StatistichePage'
import AmiciPage from './pages/AmiciPage'
import ProfiloPage from './pages/ProfiloPage'
import BottomNav from './components/BottomNav'

function Shell() {
  const { user, loading, configMissing } = useAuth()
  const [tab, setTab] = useState('home')

  if (loading) return <main className="screen center"><div className="loader">Caricamento...</div></main>
  if (configMissing) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <h1>Firebase da configurare</h1>
          <p>Inserisci le chiavi Firebase nel file .env e riavvia l'app.</p>
          <div className="env-list">
            <code>VITE_FIREBASE_API_KEY</code>
            <code>VITE_FIREBASE_AUTH_DOMAIN</code>
            <code>VITE_FIREBASE_PROJECT_ID</code>
            <code>VITE_FIREBASE_STORAGE_BUCKET</code>
            <code>VITE_FIREBASE_MESSAGING_SENDER_ID</code>
            <code>VITE_FIREBASE_APP_ID</code>
          </div>
        </section>
      </main>
    )
  }
  if (!user) return <AuthPage />

  return (
    <main className="app-shell">
      {tab === 'home' && <HomePage goAdd={() => setTab('add')} />}
      {tab === 'add' && <AddSchedina onSaved={() => setTab('home')} />}
      {tab === 'stats' && <StatistichePage />}
      {tab === 'friends' && <AmiciPage />}
      {tab === 'profile' && <ProfiloPage />}
      <BottomNav active={tab} onChange={setTab} />
    </main>
  )
}

export default function App() {
  return <AuthProvider><Shell /></AuthProvider>
}
