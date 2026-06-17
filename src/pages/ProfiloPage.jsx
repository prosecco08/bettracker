import { useAuth } from '../hooks/useAuth'

export default function ProfiloPage() {
  const { profile, signOut } = useAuth()

  return (
    <section className="page with-nav">
      <header className="plain-head">
        <h1>Profilo</h1>
        <p>Gestisci account e installazione app.</p>
      </header>

      <section className="profile-card">
        <div className="big-avatar">{profile?.username?.slice(0, 2)?.toUpperCase() || 'BT'}</div>
        <h2>{profile?.username || 'Utente'}</h2>
        <p>Per installarla su iPhone: apri il sito da Safari, condividi e scegli Aggiungi alla schermata Home.</p>
        <button onClick={signOut}>Esci</button>
      </section>
    </section>
  )
}
