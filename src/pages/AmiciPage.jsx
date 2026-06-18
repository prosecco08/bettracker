import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { money, signedMoney } from '../lib/betStats'
import {
  getLeaderboard,
  getMonthlyChallenge,
  getProfilesByIds,
  getUserByUsername,
  listFriendships,
  sendFriendRequest,
  updateFriendshipStatus
} from '../lib/data'

function getWinRate(row) {
  if (row.win_rate !== undefined && row.win_rate !== null) return Number(row.win_rate)
  const closed = Number(row.vinte || 0) + Number(row.perse || 0)
  return closed ? (Number(row.vinte || 0) / closed) * 100 : 0
}

function getRoi(row) {
  if (row.roi !== undefined && row.roi !== null) return Number(row.roi)
  const stake = Number(row.totale_puntato || 0)
  return stake ? (Number(row.profitto_totale || 0) / stake) * 100 : null
}

export default function AmiciPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [challengeRows, setChallengeRows] = useState([])
  const [friendships, setFriendships] = useState([])
  const [profilesById, setProfilesById] = useState({})
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const challengeTitle = `Sfida ${now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`

  async function load() {
    setLoading(true)
    setError('')

    const [leaderboardResult, monthlyResult] = await Promise.allSettled([
      getLeaderboard(),
      getMonthlyChallenge(month, year)
    ])
    const loadErrors = []

    if (leaderboardResult.status === 'fulfilled') {
      setRows(leaderboardResult.value)
    } else {
      loadErrors.push(`Non riesco a caricare la classifica. ${leaderboardResult.reason.message}`)
    }

    if (monthlyResult.status === 'fulfilled') {
      setChallengeRows(monthlyResult.value.slice(0, 10))
    } else {
      loadErrors.push(`Non riesco a caricare la sfida mensile. ${monthlyResult.reason.message}`)
    }

    setError(loadErrors.join(' '))
    await loadFriendships()

    setLoading(false)
  }

  async function loadFriendships() {
    try {
      const data = await listFriendships(user.uid)
      const profileIds = Array.from(new Set(data.flatMap(row => [row.requester_id, row.addressee_id])))
      setProfilesById(await getProfilesByIds(profileIds))
      setFriendships(data)
    } catch (_error) {
      setFriendships([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function sendInvite(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    const cleanUsername = username.trim().replace(/^@/, '')
    if (!cleanUsername) return

    const target = await getUserByUsername(cleanUsername).catch(() => null)

    if (!target) {
      setMessage('Username non trovato.')
      return
    }

    if (target.id === user.uid) {
      setMessage('Non puoi invitare te stesso.')
      return
    }

    try {
      await sendFriendRequest(user.uid, target.id)
    } catch (error) {
      setMessage(error.message || 'Non riesco a inviare la richiesta amicizia.')
      return
    }

    setUsername('')
    setMessage(`Richiesta inviata a @${target.username}.`)
    load()
  }

  async function updateFriendship(id, status) {
    try {
      await updateFriendshipStatus(user.uid, id, status)
    } catch (_error) {
      setMessage('Non riesco ad aggiornare la richiesta.')
      return
    }

    load()
  }

  const pendingIn = friendships.filter(row => row.status === 'pending' && row.addressee_id === user.uid)
  const pendingOut = friendships.filter(row => row.status === 'pending' && row.requester_id === user.uid)
  const accepted = friendships.filter(row => row.status === 'accepted')

  return (
    <section className="page with-nav">
      <header className="plain-head">
        <h1>Amici</h1>
        <p>Sfide mensili, inviti e classifica pubblica.</p>
      </header>

      <section className="feature-card friends-invite">
        <small>Sistema amici reale</small>
        <h2>Invita tramite username</h2>
        <form className="inline-form" onSubmit={sendInvite}>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="@marco"
          />
          <button>Invia</button>
        </form>
        <div className="username-row">
          <span>@marco</span>
          <span>@luca</span>
          <span>@andrea</span>
        </div>
        {message && <p className="helper-text">{message}</p>}
      </section>

      <section className="mini-list">
        <h2>Richieste amicizia</h2>
        {pendingIn.length === 0 && pendingOut.length === 0 && accepted.length === 0 && (
          <p className="empty inline">Nessuna richiesta amicizia.</p>
        )}
        {pendingIn.map(row => {
          const profile = profilesById[row.requester_id]
          return (
            <article key={row.id} className="friend-request">
              <span>@{profile?.username || 'utente'}</span>
              <small>Vuole aggiungerti agli amici</small>
              <div>
                <button onClick={() => updateFriendship(row.id, 'accepted')}>Accetta</button>
                <button className="ghost-button" onClick={() => updateFriendship(row.id, 'declined')}>Rifiuta</button>
              </div>
            </article>
          )
        })}
        {pendingOut.map(row => {
          const profile = profilesById[row.addressee_id]
          return (
            <article key={row.id}>
              <span>@{profile?.username || 'utente'}</span>
              <small>Richiesta inviata</small>
              <strong>In attesa</strong>
            </article>
          )
        })}
        {accepted.map(row => {
          const friendId = row.requester_id === user.uid ? row.addressee_id : row.requester_id
          const profile = profilesById[friendId]
          return (
            <article key={row.id}>
              <span>@{profile?.username || 'utente'}</span>
              <small>Amico</small>
              <strong className="accent">Attivo</strong>
            </article>
          )
        })}
      </section>

      <section className="mini-list">
        <h2>{challengeTitle}</h2>
        {!loading && challengeRows.length === 0 && <p className="empty inline">Nessuna giocata nella sfida mensile.</p>}
        {challengeRows.map((row, index) => (
          <article key={row.id}>
            <span>{index + 1}. {row.username}</span>
            <small>{row.schedine_mese || 0} schedine questo mese</small>
            <strong className={Number(row.profitto_mese) >= 0 ? 'accent' : 'negative'}>{signedMoney(row.profitto_mese)}</strong>
          </article>
        ))}
      </section>

      {error && <p className="notice error">{error}</p>}
      {loading && <p className="empty">Caricamento classifica...</p>}
      {!loading && rows.length === 0 && <p className="empty">Non ci sono ancora profili in classifica.</p>}

      <section className="summary-block">
        <h2>Classifica generale</h2>
      </section>
      <div className="leaderboard">
        {rows.map((row, index) => {
          const roi = getRoi(row)
          return (
            <article key={row.id}>
              <span className="rank">#{index + 1}</span>
              <div className="avatar" style={{ background: row.avatar_color }}>{row.username?.slice(0, 2)?.toUpperCase()}</div>
              <div>
                <strong>{row.username}</strong>
                <small>
                  {row.totale_schedine} schedine - {row.vinte} vinte - {row.perse} perse
                </small>
                <small>
                  Win rate {getWinRate(row).toFixed(1)}%{roi === null ? '' : ` - ROI ${roi.toFixed(1)}%`}
                </small>
                {row.totale_puntato !== undefined && <small>Puntato {money(row.totale_puntato)}</small>}
              </div>
              <b className={Number(row.profitto_totale) >= 0 ? 'accent' : 'negative'}>{signedMoney(row.profitto_totale)}</b>
            </article>
          )
        })}
      </div>
    </section>
  )
}
