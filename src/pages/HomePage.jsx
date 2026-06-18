import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { money, signedMoney, summarizeBets } from '../lib/betStats'
import { performanceWeather, profitTimeline, recentProfit, tipsterForm } from '../lib/performance'
import { deleteBet as removeBet, listBets, updateBetStatus } from '../lib/data'
import { MetricCard, Panel, SectionTitle, WeatherBadge } from '../components/Premium'
import BetCard from '../components/BetCard'

const moneyFormat = value => signedMoney(value)
const percentFormat = value => `${value.toFixed(1)}%`

export default function HomePage({ goAdd }) {
  const { user, profile } = useAuth()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setBets(await listBets(user.uid))
    } catch (loadError) {
      setError(`Non riesco a caricare le schedine. ${loadError.message}`)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => summarizeBets(bets), [bets])
  const weather = useMemo(() => performanceWeather(bets, stats.roi), [bets, stats.roi])
  const weeklyProfit = useMemo(() => recentProfit(bets), [bets])
  const form = useMemo(() => tipsterForm(profile?.username || 'Tipster', weather, weeklyProfit, Number(weather.detail.match(/\d+/)?.[0] || 0)), [profile, weather, weeklyProfit])
  const chartData = useMemo(() => profitTimeline(bets), [bets])
  const currentBalance = stats.totalWins - stats.totalStake

  async function updateStatus(id, stato) {
    try {
      await updateBetStatus(user.uid, id, stato)
      load()
    } catch (updateError) {
      setError(`Non riesco ad aggiornare lo stato. ${updateError.message}`)
    }
  }

  async function deleteBet(id) {
    if (!window.confirm('Vuoi eliminare questa schedina?')) return
    try {
      await removeBet(user.uid, id)
      load()
    } catch (deleteError) {
      setError(`Non riesco a eliminare la schedina. ${deleteError.message}`)
    }
  }

  const displayName = profile?.username ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1) : 'Tipster'

  return (
    <section className="page home-page with-nav">
      <header className="home-hero">
        <div className="topbar">
          <div className="brand-mark">BT</div>
          <span>BETTRACKER <b>PRO</b></span>
          <button className="notification-button" aria-label="Notifiche"><i /></button>
        </div>
        <div className="welcome-row">
          <div><small>PERFORMANCE HUB</small><h1>Ciao {displayName} <span>👋</span></h1><p>La tua settimana, in un colpo d'occhio.</p></div>
          <WeatherBadge weather={weather} />
        </div>
      </header>

      <div className="content-stack hero-overlap">
        <section className="metrics-grid">
          <MetricCard label="Saldo attuale" value={currentBalance} format={moneyFormat} tone={currentBalance >= 0 ? 'profit' : 'loss'} icon="€" />
          <MetricCard label="Profitto totale" value={stats.totalProfit} format={moneyFormat} tone={stats.totalProfit >= 0 ? 'profit' : 'loss'} icon="↗" delay={0.06} />
          <MetricCard label="ROI" value={stats.roi} format={percentFormat} tone={stats.roi >= 0 ? 'gold' : 'loss'} icon="◎" delay={0.12} />
          <MetricCard label="Win rate" value={stats.winRate} format={percentFormat} tone="gold" icon="◇" delay={0.18} />
        </section>

        <motion.section className={`form-banner ${weather.tone}`} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <span className="form-icon">{form.icon}</span>
          <div><small>FORMA DEL TIPSTER</small><h2>{form.title}</h2><p>{form.detail}</p></div>
          <b>{weeklyProfit >= 0 ? '+' : ''}{weeklyProfit.toFixed(0)}€</b>
        </motion.section>

        <Panel className="chart-panel">
          <SectionTitle eyebrow="TREND" title="Profitto nel tempo" action={<span className={`trend-pill ${weeklyProfit >= 0 ? 'up' : 'down'}`}>7G {signedMoney(weeklyProfit)}</span>} />
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={205}>
              <AreaChart data={chartData} margin={{ left: -24, right: 4, top: 12, bottom: 0 }}>
                <defs><linearGradient id="profitArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2ED573" stopOpacity=".38"/><stop offset="1" stopColor="#2ED573" stopOpacity="0"/></linearGradient></defs>
                <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#768092', fontSize: 10 }} minTickGap={26} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#768092', fontSize: 10 }} tickFormatter={value => `${value}€`} />
                <Tooltip contentStyle={{ background: '#111722', border: '1px solid rgba(255,159,67,.25)', borderRadius: 12 }} formatter={value => money(value)} />
                <Area type="monotone" dataKey="profitto" stroke="#2ED573" strokeWidth={3} fill="url(#profitArea)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Aggiungi almeno due schedine per attivare il trend.</div>}
        </Panel>

        <SectionTitle title="Ultime schedine" eyebrow={`${bets.length} TOTALI`} action={<motion.button className="text-action" whileTap={{ scale: .94 }} onClick={goAdd}>Nuova +</motion.button>} />
        {error && <p className="notice error">{error}</p>}
        {loading && <p className="empty">Caricamento schedine...</p>}
        {!loading && bets.length === 0 && <div className="premium-empty"><span>＋</span><h3>Il tuo tracking parte qui</h3><p>Registra la prima schedina e sblocca analytics, meteo e badge.</p><button onClick={goAdd}>Aggiungi schedina</button></div>}
        {!loading && bets.slice(0, 5).map(bet => <BetCard key={bet.id} bet={bet} onStatus={updateStatus} onDelete={deleteBet} />)}
      </div>
    </section>
  )
}
