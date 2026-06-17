import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { filterBetsByMonth, filterBetsByYear, money, monthProfitData, signedMoney, summarizeBets } from '../lib/betStats'
import { autoCloseFinishedBets as runAutoClose, deleteBet as removeBet, listBets, updateBetStatus } from '../lib/data'
import StatCard from '../components/StatCard'
import BetCard from '../components/BetCard'

export default function HomePage({ goAdd }) {
  const { user, profile } = useAuth()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = new Date()
  const month = today.getMonth()
  const year = today.getFullYear()

  async function load() {
    setLoading(true)
    setError('')

    try {
      setBets(await listBets(user.uid))
    } catch (_error) {
      setError('Non riesco a caricare le schedine. Riprova tra poco.')
    }

    setLoading(false)
  }

  async function autoCloseFinishedBetsOnce() {
    const todayKey = new Date().toISOString().slice(0, 10)
    const storageKey = `auto-close-results:${user.uid}:${todayKey}`
    if (localStorage.getItem(storageKey)) return

    const data = await runAutoClose().catch(() => null)
    if (!data?.ok) return

    localStorage.setItem(storageKey, '1')
    if (data?.auto_close?.closed > 0) {
      load()
    }
  }

  useEffect(() => {
    load()
    autoCloseFinishedBetsOnce()
  }, [])

  const totalStats = useMemo(() => summarizeBets(bets), [bets])
  const monthStats = useMemo(() => summarizeBets(filterBetsByMonth(bets, month, year)), [bets, month, year])
  const yearStats = useMemo(() => summarizeBets(filterBetsByYear(bets, year)), [bets, year])
  const chartData = useMemo(() => monthProfitData(bets, year), [bets, year])

  async function updateStatus(id, stato) {
    try {
      await updateBetStatus(user.uid, id, stato)
      load()
    } catch (_error) {
      setError('Non riesco ad aggiornare lo stato della schedina.')
    }
  }

  async function deleteBet(id) {
    const confirmed = window.confirm('Vuoi eliminare questa schedina?')
    if (!confirmed) return

    try {
      await removeBet(user.uid, id)
      load()
    } catch (_error) {
      setError('Non riesco a eliminare la schedina.')
    }
  }

  return (
    <section className="page with-nav">
      <header className="hero">
        <div>
          <p>Benvenuto,</p>
          <h1>{profile?.username || 'Utente'}</h1>
        </div>
        <span className="pill">{today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</span>
      </header>

      <section className="stats-grid dashboard-grid">
        <StatCard label="Profitto totale" value={signedMoney(totalStats.totalProfit)} accent={totalStats.totalProfit >= 0} />
        <StatCard label="Profitto mensile" value={signedMoney(monthStats.totalProfit)} accent={monthStats.totalProfit >= 0} />
        <StatCard label="Profitto annuale" value={signedMoney(yearStats.totalProfit)} accent={yearStats.totalProfit >= 0} />
        <StatCard label="Totale puntato" value={money(totalStats.totalStake)} />
        <StatCard label="Totale vincite" value={money(totalStats.totalWins)} />
        <StatCard label="Vinte" value={totalStats.won} accent />
        <StatCard label="Perse" value={totalStats.lost} />
        <StatCard label="In corso" value={totalStats.pending} />
        <StatCard label="Win rate" value={`${totalStats.winRate.toFixed(1)}%`} accent />
        <StatCard label="ROI" value={`${totalStats.roi.toFixed(1)}%`} accent={totalStats.roi >= 0} />
      </section>

      <section className="panel">
        <h2>Andamento annuale</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis width={36} tickLine={false} axisLine={false} />
            <Tooltip formatter={value => money(value)} />
            <Bar dataKey="profitto" radius={[6, 6, 0, 0]} fill="#15936d" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="list-head">
        <h2>Ultime schedine</h2>
        <button onClick={goAdd}>+ Aggiungi</button>
      </section>

      {error && <p className="notice error">{error}</p>}
      {loading && <p className="empty">Caricamento schedine...</p>}
      {!loading && bets.length === 0 && <p className="empty">Nessuna schedina inserita. Aggiungi la prima per vedere le statistiche.</p>}
      {!loading && bets.slice(0, 5).map(bet => (
        <BetCard key={bet.id} bet={bet} onStatus={updateStatus} onDelete={deleteBet} />
      ))}
    </section>
  )
}
