import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { championshipProfitRows, filterBetsByMonth, filterBetsByYear, money, signedMoney, summarizeBets } from '../lib/betStats'
import { calendarHeatmap, predictionDistribution, profitTimeline } from '../lib/performance'
import { listBets } from '../lib/data'
import { MetricCard, Panel, SectionTitle } from '../components/Premium'

const PIE_COLORS = ['#FF9F43', '#2ED573', '#7C5CFC', '#45AAF2', '#FF4757', '#D6A85F']
const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const signedFormat = value => signedMoney(value)
const percentFormat = value => `${value.toFixed(1)}%`
const numberFormat = value => Math.round(value).toString()

function Heatmap({ days }) {
  return (
    <div className="heatmap" aria-label="Calendario profitti">
      {days.map(day => (
        <span
          key={day.key}
          className={day.profit > 0 ? 'gain' : day.profit < 0 ? 'drop' : ''}
          title={`${day.date.toLocaleDateString('it-IT')}: ${signedMoney(day.profit)}`}
          style={{ '--intensity': Math.min(1, Math.abs(day.profit) / 50) }}
        />
      ))}
    </div>
  )
}

export default function StatistichePage() {
  const { user } = useAuth()
  const now = new Date()
  const [bets, setBets] = useState([])
  const [year, setYear] = useState(now.getFullYear())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listBets(user.uid, 'asc').then(setBets).catch(loadError => setError(`Non riesco a caricare le statistiche. ${loadError.message}`)).finally(() => setLoading(false))
  }, [])

  const years = useMemo(() => [...new Set([now.getFullYear(), ...bets.map(bet => new Date(bet.created_at || bet.data_partita).getFullYear())])].sort((a, b) => b - a), [bets])
  const yearBets = useMemo(() => filterBetsByYear(bets, year), [bets, year])
  const yearStats = useMemo(() => summarizeBets(yearBets), [yearBets])
  const monthStats = useMemo(() => summarizeBets(filterBetsByMonth(bets, now.getMonth(), now.getFullYear())), [bets])
  const timeline = useMemo(() => profitTimeline(yearBets), [yearBets])
  const distribution = useMemo(() => predictionDistribution(yearBets), [yearBets])
  const championships = useMemo(() => championshipProfitRows(yearBets).sort((a, b) => b.profitto - a.profitto), [yearBets])
  const heatmap = useMemo(() => calendarHeatmap(yearBets), [yearBets])

  return (
    <section className="page with-nav stats-page">
      <header className="page-header">
        <div><small>ANALYTICS LAB</small><h1>Statistiche</h1><p>Numeri chiari. Decisioni migliori.</p></div>
        <select className="year-select" value={year} onChange={event => setYear(Number(event.target.value))}>{years.map(value => <option key={value}>{value}</option>)}</select>
      </header>

      <div className="content-stack">
        {error && <p className="notice error">{error}</p>}
        {loading && <p className="empty">Preparazione analytics...</p>}
        {!loading && <>
          <section className="metrics-grid metrics-compact">
            <MetricCard label="Profitto totale" value={yearStats.totalProfit} format={signedFormat} tone={yearStats.totalProfit >= 0 ? 'profit' : 'loss'} />
            <MetricCard label={`Profitto ${monthNames[now.getMonth()]}`} value={monthStats.totalProfit} format={signedFormat} tone={monthStats.totalProfit >= 0 ? 'profit' : 'loss'} delay={.04} />
            <MetricCard label="ROI" value={yearStats.roi} format={percentFormat} tone="gold" delay={.08} />
            <MetricCard label="Win rate" value={yearStats.winRate} format={percentFormat} tone="gold" delay={.12} />
            <MetricCard label="Totale schedine" value={yearBets.length} format={numberFormat} delay={.16} />
            <MetricCard label="Vinte / Perse" value={yearStats.won} format={value => `${Math.round(value)} / ${yearStats.lost}`} tone="profit" delay={.2} />
          </section>

          <Panel className="chart-panel wide-chart">
            <SectionTitle eyebrow="CUMULATIVO" title="Profitto nel tempo" />
            <ResponsiveContainer width="100%" height={245}>
              <LineChart data={timeline} margin={{ left: -20, right: 8, top: 14 }}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#768092', fontSize: 10 }} minTickGap={25} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#768092', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111722', border: '1px solid rgba(255,159,67,.25)', borderRadius: 12 }} formatter={value => money(value)} />
                <Line type="monotone" dataKey="profitto" stroke="#FF9F43" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#2ED573' }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          <Panel className="chart-panel donut-panel">
            <SectionTitle eyebrow="MERCATI" title="Distribuzione pronostici" />
            {distribution.length ? <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={4}>{distribution.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#111722', border: 0, borderRadius: 12 }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart>
            </ResponsiveContainer> : <div className="chart-empty">Nessun pronostico nel periodo.</div>}
          </Panel>

          <Panel className="chart-panel">
            <SectionTitle eyebrow="CAMPIONATI" title="ROI per campionato" />
            {championships.length ? <ResponsiveContainer width="100%" height={Math.max(210, championships.length * 48)}>
              <BarChart data={championships} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" width={96} tick={{ fill: '#AAB2C0', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111722', border: 0, borderRadius: 12 }} formatter={value => signedMoney(value)} />
                <Bar dataKey="profitto" radius={[0, 8, 8, 0]}>{championships.map(row => <Cell key={row.label} fill={row.profitto >= 0 ? '#2ED573' : '#FF4757'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer> : <div className="chart-empty">Nessun campionato nel periodo.</div>}
          </Panel>

          <Panel className="heatmap-panel">
            <SectionTitle eyebrow="ULTIME 12 SETTIMANE" title="Heatmap performance" />
            <Heatmap days={heatmap} />
            <div className="heatmap-legend"><span><i className="drop" />Perdita</span><span><i />Neutro</span><span><i className="gain" />Profitto</span></div>
          </Panel>
        </>}
      </div>
    </section>
  )
}
