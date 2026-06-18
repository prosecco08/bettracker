import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { signedMoney, streakStats, summarizeBets } from '../lib/betStats'
import { earnedBadges, performanceWeather } from '../lib/performance'
import { listBets } from '../lib/data'
import { AnimatedNumber, Panel, SectionTitle, WeatherBadge } from '../components/Premium'

export default function ProfiloPage() {
  const { user, profile, signOut } = useAuth()
  const [bets, setBets] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { listBets(user.uid).then(setBets).catch(loadError => setError(loadError.message)) }, [])
  const stats = useMemo(() => summarizeBets(bets), [bets])
  const streak = useMemo(() => streakStats(bets), [bets])
  const weather = useMemo(() => performanceWeather(bets, stats.roi), [bets, stats.roi])
  const badges = useMemo(() => earnedBadges(bets, stats), [bets, stats])

  return (
    <section className="page with-nav profile-page">
      <header className="page-header"><div><small>TIPSTER IDENTITY</small><h1>Profilo</h1><p>La tua reputazione, costruita giocata dopo giocata.</p></div></header>
      <div className="content-stack">
        {error && <p className="notice error">{error}</p>}
        <motion.section className="profile-hero" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="profile-orbit"><div className="big-avatar" style={{ background: profile?.avatar_color }}>{profile?.username?.slice(0, 2)?.toUpperCase() || 'BT'}</div><span>{weather.icon}</span></div>
          <small>MEMBRO BETTRACKER</small><h2>@{profile?.username || 'utente'}</h2><WeatherBadge weather={weather} />
        </motion.section>

        <section className="profile-metrics">
          <Panel><small>Profitto totale</small><strong className={stats.totalProfit >= 0 ? 'accent' : 'negative'}><AnimatedNumber value={stats.totalProfit} format={signedMoney} /></strong></Panel>
          <Panel><small>ROI storico</small><strong><AnimatedNumber value={stats.roi} format={value => `${value.toFixed(1)}%`} /></strong></Panel>
          <Panel><small>Streak attuale</small><strong className={streak.currentWins ? 'accent' : streak.currentLosses ? 'negative' : ''}>{streak.currentWins || streak.currentLosses || 0}<i>{streak.currentWins ? 'W' : streak.currentLosses ? 'L' : ''}</i></strong></Panel>
          <Panel><small>Miglior streak</small><strong>{streak.bestWins}<i>W</i></strong></Panel>
        </section>

        <SectionTitle eyebrow={`${badges.filter(badge => badge.unlocked).length}/${badges.length} SBLOCCATI`} title="Badge" />
        <div className="badge-grid">{badges.map((badge, index) => <motion.article key={badge.id} className={badge.unlocked ? 'unlocked' : 'locked'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }}><span>{badge.icon}</span><strong>{badge.name}</strong><small>{badge.detail}</small>{badge.unlocked && <i>SBLOCCATO</i>}</motion.article>)}</div>

        <Panel className="account-panel"><SectionTitle eyebrow="ACCOUNT" title="BetTracker Pro" /><div><span>Email</span><b>{user.email}</b></div><div><span>Schedine tracciate</span><b>{bets.length}</b></div><motion.button whileTap={{ scale: .96 }} className="logout-button" onClick={signOut}>Esci dall'account</motion.button></Panel>
      </div>
    </section>
  )
}
