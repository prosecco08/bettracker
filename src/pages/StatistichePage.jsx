import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { getGoal, listBets, saveGoal as saveUserGoal } from '../lib/data'
import {
  championshipProfitRows,
  filterBetsByMonth,
  filterBetsByYear,
  money,
  monthProfitData,
  reliabilityRating,
  signedMoney,
  streakStats,
  summarizeBets
} from '../lib/betStats'

const MONTHS = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre'
]

function SummaryCards({ title, stats }) {
  return (
    <section className="summary-block">
      <h2>{title}</h2>
      <div className="stats-grid light compact">
        <div><small>Profitto</small><strong className={stats.totalProfit >= 0 ? 'accent' : 'negative'}>{signedMoney(stats.totalProfit)}</strong></div>
        <div><small>Puntato</small><strong>{money(stats.totalStake)}</strong></div>
        <div><small>Vincite</small><strong>{money(stats.totalWins)}</strong></div>
        <div><small>Win rate</small><strong>{stats.winRate.toFixed(1)}%</strong></div>
        <div><small>ROI</small><strong>{stats.roi.toFixed(1)}%</strong></div>
        <div><small>Schedine</small><strong>{stats.won + stats.lost + stats.pending}</strong></div>
      </div>
    </section>
  )
}

function ChampionshipList({ title, rows, empty }) {
  return (
    <section className="mini-list">
      <h2>{title}</h2>
      {rows.length === 0 && <p className="empty inline">{empty}</p>}
      {rows.map(row => (
        <article key={row.label}>
          <span>{row.label}</span>
          <small>{row.schedine} schedine</small>
          <strong className={row.profitto >= 0 ? 'accent' : 'negative'}>{signedMoney(row.profitto)}</strong>
        </article>
      ))}
    </section>
  )
}

function ReliabilityCard({ stats }) {
  const rating = reliabilityRating(stats)

  return (
    <section className="feature-card reliability-card">
      <div>
        <small>Sistema affidabilita</small>
        <h2>Rating: {rating}/100</h2>
        <p>Basato su ROI, win rate e volume giocate.</p>
      </div>
      <div className="rating-ring" style={{ '--rating': `${rating}%` }}>
        <strong>{rating}</strong>
      </div>
      <div className="metric-strip">
        <span>ROI <b>{stats.roi.toFixed(1)}%</b></span>
        <span>Win rate <b>{stats.winRate.toFixed(1)}%</b></span>
        <span>Volume <b>{stats.closed}</b></span>
      </div>
    </section>
  )
}

function StreakCard({ streak }) {
  return (
    <section className="feature-card">
      <small>Streak</small>
      <h2>Forma recente</h2>
      <div className="stats-grid light compact no-pad">
        <div><small>Miglior streak vittorie</small><strong className="accent">{streak.bestWins}</strong></div>
        <div><small>Streak attuale</small><strong className="accent">{streak.currentWins}</strong></div>
        <div><small>Peggior streak sconfitte</small><strong className="negative">{streak.worstLosses}</strong></div>
        <div><small>Sconfitte attuali</small><strong className="negative">{streak.currentLosses}</strong></div>
      </div>
    </section>
  )
}

function GoalCard({ goalValue, setGoalValue, savedGoal, progress, onSave }) {
  return (
    <section className="feature-card goal-card">
      <small>Obiettivo</small>
      <h2>Profitto mese: {signedMoney(savedGoal)}</h2>
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="goal-row">
        <strong>{progress}% completato</strong>
        <span>{signedMoney(goalValue || 0)}</span>
      </div>
      <form className="inline-form" onSubmit={onSave}>
        <input
          type="number"
          step="1"
          min="1"
          value={goalValue}
          onChange={e => setGoalValue(e.target.value)}
          placeholder="Es. 100"
        />
        <button>Salva</button>
      </form>
    </section>
  )
}

export default function StatistichePage() {
  const { user } = useAuth()
  const now = new Date()
  const [bets, setBets] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [goalValue, setGoalValue] = useState('100')
  const [savedGoal, setSavedGoal] = useState(100)

  const goalKey = `monthly-profit-goal:${user.uid}:${selectedYear}-${selectedMonth + 1}`

  async function load() {
    setLoading(true)
    setError('')

    try {
      setBets(await listBets(user.uid, 'asc'))
    } catch (error) {
      setError(`Non riesco a caricare le statistiche. ${error.message}`)
    }

    setLoading(false)
  }

  async function loadGoal() {
    const data = await getGoal(user.uid, selectedMonth + 1, selectedYear).catch(() => null)

    if (data?.target_profit) {
      setSavedGoal(Number(data.target_profit))
      setGoalValue(String(Number(data.target_profit)))
      return
    }

    const localGoal = Number(localStorage.getItem(goalKey) || 100)
    setSavedGoal(localGoal)
    setGoalValue(String(localGoal))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    loadGoal()
  }, [selectedMonth, selectedYear])

  const years = useMemo(() => {
    const values = new Set([now.getFullYear()])
    bets.forEach(bet => values.add(new Date(bet.created_at || bet.data_partita).getFullYear()))
    return Array.from(values).sort((a, b) => b - a)
  }, [bets])

  const monthBets = useMemo(() => filterBetsByMonth(bets, selectedMonth, selectedYear), [bets, selectedMonth, selectedYear])
  const yearBets = useMemo(() => filterBetsByYear(bets, selectedYear), [bets, selectedYear])
  const monthStats = useMemo(() => summarizeBets(monthBets), [monthBets])
  const yearStats = useMemo(() => summarizeBets(yearBets), [yearBets])
  const chartData = useMemo(() => monthProfitData(bets, selectedYear), [bets, selectedYear])
  const streak = useMemo(() => streakStats(bets), [bets])
  const goalProgress = savedGoal > 0 ? Math.max(0, Math.min(100, Math.round((monthStats.totalProfit / savedGoal) * 100))) : 0

  const championshipRows = useMemo(() => championshipProfitRows(yearBets), [yearBets])
  const bestChampionships = [...championshipRows].sort((a, b) => b.profitto - a.profitto).slice(0, 5)
  const worstChampionships = [...championshipRows].sort((a, b) => a.profitto - b.profitto).slice(0, 5)

  async function saveGoal(event) {
    event.preventDefault()
    const nextGoal = Math.max(1, Number(goalValue || 0))
    setSavedGoal(nextGoal)
    setGoalValue(String(nextGoal))
    localStorage.setItem(goalKey, String(nextGoal))

    try {
      await saveUserGoal(user.uid, selectedMonth + 1, selectedYear, nextGoal)
    } catch (_error) {
      setError('Obiettivo salvato sul dispositivo. Non riesco a sincronizzarlo online.')
    }
  }

  return (
    <section className="page with-nav">
      <header className="plain-head">
        <h1>Statistiche</h1>
        <p>Resoconto mensile e annuale delle tue schedine.</p>
      </header>

      <section className="filters">
        <label>
          Mese
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
            {MONTHS.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
        </label>

        <label>
          Anno
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
      </section>

      {error && <p className="notice error">{error}</p>}
      {loading && <p className="empty">Caricamento statistiche...</p>}

      {!loading && (
        <>
          <ReliabilityCard stats={yearStats} />
          <GoalCard
            goalValue={goalValue}
            setGoalValue={setGoalValue}
            savedGoal={savedGoal}
            progress={goalProgress}
            onSave={saveGoal}
          />
          <StreakCard streak={streak} />
          <SummaryCards title={`Riepilogo ${MONTHS[selectedMonth]} ${selectedYear}`} stats={monthStats} />
          <SummaryCards title={`Riepilogo annuale ${selectedYear}`} stats={yearStats} />

          <section className="panel">
            <h2>Profitto per mese</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis width={38} tickLine={false} axisLine={false} />
                <Tooltip formatter={value => money(value)} />
                <Bar dataKey="profitto" fill="#15936d" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <ChampionshipList title="Migliori campionati" rows={bestChampionships} empty="Nessun campionato nel periodo." />
          <ChampionshipList title="Peggiori campionati" rows={worstChampionships} empty="Nessun campionato nel periodo." />
        </>
      )}
    </section>
  )
}
