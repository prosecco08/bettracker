import { betProfit, streakStats } from './betStats.js'

function betDate(bet) {
  return new Date(bet.created_at || bet.data_partita)
}

export function recentProfit(bets, days = 7) {
  const threshold = new Date()
  threshold.setHours(0, 0, 0, 0)
  threshold.setDate(threshold.getDate() - (days - 1))
  return bets.filter(bet => betDate(bet) >= threshold).reduce((sum, bet) => sum + betProfit(bet), 0)
}

export function performanceWeather(bets, roi = 0) {
  const streak = streakStats(bets)
  const lastSevenProfit = recentProfit(bets, 7)

  if (Number(roi) > 25) return { icon: '🔥', label: 'Fuoco', tone: 'fire', detail: 'ROI sopra il 25%' }
  if (streak.currentWins >= 5) return { icon: '☀️', label: 'Sole', tone: 'sun', detail: `${streak.currentWins} vittorie consecutive` }
  if (streak.currentLosses >= 5) return { icon: '⛈️', label: 'Temporale', tone: 'storm', detail: `${streak.currentLosses} sconfitte consecutive` }
  if (streak.currentLosses >= 3) return { icon: '🌧️', label: 'Pioggia', tone: 'rain', detail: `${streak.currentLosses} sconfitte consecutive` }
  if (lastSevenProfit > 0) return { icon: '🌤️', label: 'Sereno', tone: 'clear', detail: 'Settimana in profitto' }
  return { icon: '☁️', label: 'Nuvoloso', tone: 'cloud', detail: 'Periodo neutro' }
}

export function weatherFromLeaderboard(row) {
  const roi = Number(row.roi || 0)
  const wins = Number(row.current_wins || 0)
  const losses = Number(row.current_losses || 0)
  const recent = Number(row.recent_profit || 0)

  if (roi > 25) return { icon: '🔥', label: 'Fuoco', tone: 'fire', detail: 'ROI sopra il 25%' }
  if (wins >= 5) return { icon: '☀️', label: 'Sole', tone: 'sun', detail: `${wins} vittorie consecutive` }
  if (losses >= 5) return { icon: '⛈️', label: 'Temporale', tone: 'storm', detail: `${losses} sconfitte consecutive` }
  if (losses >= 3) return { icon: '🌧️', label: 'Pioggia', tone: 'rain', detail: `${losses} sconfitte consecutive` }
  if (recent > 0) return { icon: '🌤️', label: 'Sereno', tone: 'clear', detail: 'Settimana in profitto' }
  return { icon: '☁️', label: 'Nuvoloso', tone: 'cloud', detail: 'Periodo neutro' }
}

export function tipsterForm(name, weather, recent, streak) {
  if (weather.tone === 'storm' || weather.tone === 'rain') {
    return { icon: weather.icon, title: `${name} è in difficoltà`, detail: `${recent.toFixed(2)}€ negli ultimi 7 giorni` }
  }
  if (streak >= 5) {
    return { icon: weather.icon, title: `${name} domina la settimana`, detail: `${streak} vittorie consecutive` }
  }
  if (recent > 0) {
    return { icon: weather.icon, title: `${name} è in forma`, detail: `+${recent.toFixed(2)}€ negli ultimi 7 giorni` }
  }
  return { icon: weather.icon, title: `${name} cerca continuità`, detail: 'Periodo di studio e gestione' }
}

export function earnedBadges(bets, stats) {
  const serieAProfit = bets
    .filter(bet => `${bet.campionato} ${bet.campionato_label}`.toLowerCase().includes('serie a') || bet.campionato === 'SA')
    .reduce((sum, bet) => sum + betProfit(bet), 0)
  const multigolWins = bets.filter(bet => bet.stato === 'vinta' && String(bet.pronostico).toLowerCase().includes('multigol')).length
  const streak = streakStats(bets)
  const definitions = [
    { id: 'rookie', icon: '◆', name: 'Rookie', detail: '10 schedine', unlocked: bets.length >= 10 },
    { id: 'stratega', icon: '◈', name: 'Stratega', detail: 'ROI oltre 15%', unlocked: stats.roi > 15 },
    { id: 'serie-a', icon: '♛', name: 'Re della Serie A', detail: '100€ di profitto', unlocked: serieAProfit > 100 },
    { id: 'multigol', icon: '◎', name: 'Multigol Master', detail: '20 vincite multigol', unlocked: multigolWins >= 20 },
    { id: 'hot', icon: '🔥', name: 'Hot Streak', detail: '5 vittorie di fila', unlocked: streak.bestWins >= 5 },
    { id: 'cold', icon: '❄', name: 'Ice Cold', detail: '5 sconfitte di fila', unlocked: streak.worstLosses >= 5 }
  ]
  return definitions
}

export function profitTimeline(bets) {
  let running = 0
  return [...bets]
    .sort((a, b) => betDate(a) - betDate(b))
    .map(bet => {
      running += betProfit(bet)
      return {
        date: betDate(bet).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        profitto: Number(running.toFixed(2))
      }
    })
}

export function predictionDistribution(bets) {
  const groups = new Map()
  for (const bet of bets) {
    const label = String(bet.pronostico || 'Altro').split(' - ')[0] || 'Altro'
    groups.set(label, (groups.get(label) || 0) + 1)
  }
  return [...groups].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)
}

export function calendarHeatmap(bets, days = 84) {
  const byDay = new Map()
  for (const bet of bets) {
    const key = betDate(bet).toISOString().slice(0, 10)
    byDay.set(key, (byDay.get(key) || 0) + betProfit(bet))
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - index - 1))
    const key = date.toISOString().slice(0, 10)
    return { key, date, profit: byDay.get(key) || 0 }
  })
}
