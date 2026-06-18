import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === 'home' && <HomePage goAdd={() => setTab('add')} />}
          {tab === 'add' && <AddSchedina onSaved={() => setTab('home')} />}
          {tab === 'stats' && <StatistichePage />}
          {tab === 'friends' && <AmiciPage />}
          {tab === 'profile' && <ProfiloPage />}
        </motion.div>
      </AnimatePresence>
      <BottomNav active={tab} onChange={setTab} />
    </main>
  )
}

export default function App() {
  return <AuthProvider><Shell /></AuthProvider>
}
