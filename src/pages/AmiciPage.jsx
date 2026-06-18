import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { signedMoney } from '../lib/betStats'
import { tipsterForm, weatherFromLeaderboard } from '../lib/performance'
import { Panel, SectionTitle, WeatherBadge } from '../components/Premium'
import { getLeaderboard, getMonthlyChallenge, getProfilesByIds, getUserByUsername, listFriendships, sendFriendRequest, updateFriendshipStatus } from '../lib/data'

const medals = ['🥇', '🥈', '🥉']
const getWinRate = row => Number(row.win_rate ?? ((Number(row.vinte) + Number(row.perse)) ? (Number(row.vinte) / (Number(row.vinte) + Number(row.perse))) * 100 : 0))
const getRoi = row => Number(row.roi || 0)

export default function AmiciPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [monthly, setMonthly] = useState([])
  const [friendships, setFriendships] = useState([])
  const [profiles, setProfiles] = useState({})
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTipster, setSelectedTipster] = useState(null)
  const now = new Date()

  async function loadFriendships() {
    try {
      const data = await listFriendships(user.uid)
      const ids = [...new Set(data.flatMap(row => [row.requester_id, row.addressee_id]))]
      setProfiles(await getProfilesByIds(ids))
      setFriendships(data)
    } catch (_error) {
      setFriendships([])
    }
  }

  async function load() {
    setLoading(true)
    const results = await Promise.allSettled([getLeaderboard(), getMonthlyChallenge(now.getMonth() + 1, now.getFullYear())])
    if (results[0].status === 'fulfilled') setRows(results[0].value)
    else setError(`Classifica non disponibile. ${results[0].reason.message}`)
    if (results[1].status === 'fulfilled') setMonthly(results[1].value)
    await loadFriendships()
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function sendInvite(event) {
    event.preventDefault()
    setMessage('')
    const clean = username.trim().replace(/^@/, '')
    if (!clean) return
    const target = await getUserByUsername(clean).catch(() => null)
    if (!target) return setMessage('Username non trovato.')
    if (target.id === user.uid) return setMessage('Non puoi invitare te stesso.')
    try {
      await sendFriendRequest(user.uid, target.id)
      setUsername('')
      setMessage(`Richiesta inviata a @${target.username}`)
      loadFriendships()
    } catch (inviteError) { setMessage(inviteError.message) }
  }

  async function updateFriendship(id, status) {
    try { await updateFriendshipStatus(user.uid, id, status); loadFriendships() } catch (_error) { setMessage('Aggiornamento non riuscito.') }
  }

  const requests = friendships.filter(row => row.status === 'pending')

  return (
    <section className="page with-nav friends-page">
      <header className="page-header social-header"><div><small>TIPSTER LEAGUE</small><h1>Classifica</h1><p>Segui la forma. Sfida gli amici.</p></div><span className="live-badge"><i /> LIVE</span></header>
      <div className="content-stack">
        <Panel className="invite-panel">
          <SectionTitle eyebrow="SOCIAL" title="Aggiungi un tipster" />
          <form className="invite-form" onSubmit={sendInvite}><span>@</span><input value={username} onChange={event => setUsername(event.target.value)} placeholder="username" /><motion.button whileTap={{ scale: .94 }}>Invita</motion.button></form>
          {message && <p className="helper-text">{message}</p>}
          {requests.length > 0 && <div className="request-list">{requests.map(request => {
            const otherId = request.requester_id === user.uid ? request.addressee_id : request.requester_id
            const incoming = request.addressee_id === user.uid
            return <div key={request.id}><span>@{profiles[otherId]?.username || 'utente'}</span>{incoming ? <b><button onClick={() => updateFriendship(request.id, 'accepted')}>Accetta</button><button onClick={() => updateFriendship(request.id, 'declined')}>Rifiuta</button></b> : <small>In attesa</small>}</div>
          })}</div>}
        </Panel>

        {error && <p className="notice error">{error}</p>}
        {loading && <p className="empty">Aggiornamento classifica...</p>}

        {!loading && rows.length > 0 && <>
          <SectionTitle eyebrow="TOP PERFORMER" title="Il podio" />
          <div className="podium">
            {rows.slice(0, 3).map((row, index) => {
              const weather = weatherFromLeaderboard(row)
              return <motion.article key={row.id} className={`podium-card place-${index + 1}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .08 }} layout>
                <span className="medal">{medals[index]}</span>
                <div className="avatar" style={{ background: row.avatar_color }}>{row.username?.slice(0, 2).toUpperCase()}</div>
                <strong>@{row.username}</strong><WeatherBadge weather={weather} compact />
                <b className={Number(row.profitto_totale) >= 0 ? 'accent' : 'negative'}>{signedMoney(row.profitto_totale)}</b>
                <small>ROI {getRoi(row).toFixed(1)}%</small>
              </motion.article>
            })}
          </div>

          <SectionTitle eyebrow="FORMA LIVE" title="Cosa sta succedendo" />
          <div className="social-feed">{rows.slice(0, 3).map(row => {
            const weather = weatherFromLeaderboard(row)
            const form = tipsterForm(row.username, weather, Number(row.recent_profit || 0), Number(row.current_wins || 0))
            return <motion.article key={row.id} whileHover={{ x: 3 }}><span>{form.icon}</span><div><strong>{form.title}</strong><small>{form.detail}</small></div></motion.article>
          })}</div>

          <SectionTitle eyebrow={`${rows.length} TIPSTER`} title="Classifica generale" />
          <div className="leaderboard premium-leaderboard"><AnimatePresence>{rows.map((row, index) => {
            const weather = weatherFromLeaderboard(row)
            return <motion.article key={row.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * .04, .3) }} className={index < 3 ? 'top-rank' : ''} onClick={() => setSelectedTipster(row)}>
              <span className="rank">{index < 3 ? medals[index] : `#${index + 1}`}</span>
              <div className="avatar" style={{ background: row.avatar_color }}>{row.username?.slice(0, 2).toUpperCase()}</div>
              <div className="leader-copy"><strong>@{row.username}</strong><WeatherBadge weather={weather} compact /><small>{row.vinte}V · {row.perse}P · WR {getWinRate(row).toFixed(1)}%</small></div>
              <div className="leader-score"><b className={Number(row.profitto_totale) >= 0 ? 'accent' : 'negative'}>{signedMoney(row.profitto_totale)}</b><small>ROI {getRoi(row).toFixed(1)}%</small></div>
            </motion.article>
          })}</AnimatePresence></div>

          <Panel className="monthly-panel"><SectionTitle eyebrow={now.toLocaleDateString('it-IT', { month: 'long' }).toUpperCase()} title="Sfida mensile" />{monthly.length ? monthly.slice(0, 5).map((row, index) => <div className="monthly-row" key={row.id}><span>{index + 1}</span><strong>@{row.username}</strong><small>{row.schedine_mese} schedine</small><b className={Number(row.profitto_mese) >= 0 ? 'accent' : 'negative'}>{signedMoney(row.profitto_mese)}</b></div>) : <p className="chart-empty">La sfida aspetta la prima giocata.</p>}</Panel>
        </>}

        <AnimatePresence>{selectedTipster && (() => {
          const weather = weatherFromLeaderboard(selectedTipster)
          const form = tipsterForm(selectedTipster.username, weather, Number(selectedTipster.recent_profit || 0), Number(selectedTipster.current_wins || 0))
          return <motion.div className="tipster-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTipster(null)}>
            <motion.section className="tipster-modal" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={event => event.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedTipster(null)}>×</button>
              <div className="big-avatar" style={{ background: selectedTipster.avatar_color }}>{selectedTipster.username?.slice(0, 2).toUpperCase()}</div>
              <small>TIPSTER PROFILE</small><h2>@{selectedTipster.username}</h2><WeatherBadge weather={weather} />
              <div className="tipster-modal-stats"><span><small>Profitto</small><b className={Number(selectedTipster.profitto_totale) >= 0 ? 'accent' : 'negative'}>{signedMoney(selectedTipster.profitto_totale)}</b></span><span><small>ROI</small><b>{getRoi(selectedTipster).toFixed(1)}%</b></span><span><small>Win rate</small><b>{getWinRate(selectedTipster).toFixed(1)}%</b></span></div>
              <div className="modal-form"><span>{form.icon}</span><div><strong>{form.title}</strong><small>{form.detail}</small></div></div>
            </motion.section>
          </motion.div>
        })()}</AnimatePresence>
      </div>
    </section>
  )
}
