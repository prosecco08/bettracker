export function money(value) {
  return `${Number(value || 0).toFixed(2)}€`
}

export function signedMoney(value) {
  const amount = Number(value || 0)
  return `${amount >= 0 ? '+' : '-'}${Math.abs(amount).toFixed(2)}€`
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function betProfit(bet) {
  const stake = Number(bet?.puntata || 0)
  const potentialWin = Number(bet?.vincita_potenziale || 0)

  if (bet?.stato === 'vinta') return potentialWin - stake
  if (bet?.stato === 'persa') return -stake
  return 0
}

export function summarizeBets(bets) {
  const totalStake = bets.reduce((sum, bet) => sum + Number(bet.puntata || 0), 0)
  const totalWins = bets
    .filter(bet => bet.stato === 'vinta')
    .reduce((sum, bet) => sum + Number(bet.vincita_potenziale || 0), 0)
  const totalProfit = bets.reduce((sum, bet) => sum + betProfit(bet), 0)
  const won = bets.filter(bet => bet.stato === 'vinta').length
  const lost = bets.filter(bet => bet.stato === 'persa').length
  const pending = bets.filter(bet => bet.stato === 'in_corso').length
  const closed = won + lost

  return {
    totalStake,
    totalWins,
    totalProfit,
    won,
    lost,
    pending,
    closed,
    winRate: closed ? (won / closed) * 100 : 0,
    roi: totalStake ? (totalProfit / totalStake) * 100 : 0
  }
}

export function reliabilityRating(stats) {
  const roiScore = clamp(((Number(stats.roi || 0) + 20) / 50) * 100, 0, 100)
  const winRateScore = clamp(Number(stats.winRate || 0), 0, 100)
  const volumeScore = clamp((Number(stats.closed || 0) / 30) * 100, 0, 100)

  return Math.round((roiScore * 0.4) + (winRateScore * 0.4) + (volumeScore * 0.2))
}

export function streakStats(bets) {
  const closed = bets
    .filter(bet => bet.stato === 'vinta' || bet.stato === 'persa')
    .sort((a, b) => new Date(a.created_at || a.data_partita) - new Date(b.created_at || b.data_partita))

  let bestWins = 0
  let currentWins = 0
  let worstLosses = 0
  let currentLosses = 0
  let tailStatus = ''
  let tailCount = 0

  for (const bet of closed) {
    if (bet.stato === 'vinta') {
      currentWins += 1
      currentLosses = 0
    } else {
      currentLosses += 1
      currentWins = 0
    }

    bestWins = Math.max(bestWins, currentWins)
    worstLosses = Math.max(worstLosses, currentLosses)

    if (tailStatus === bet.stato) tailCount += 1
    else {
      tailStatus = bet.stato
      tailCount = 1
    }
  }

  return {
    bestWins,
    currentWins: tailStatus === 'vinta' ? tailCount : 0,
    worstLosses,
    currentLosses: tailStatus === 'persa' ? tailCount : 0
  }
}

export function filterBetsByMonth(bets, month, year) {
  return bets.filter(bet => {
    const date = new Date(bet.created_at || bet.data_partita)
    return date.getMonth() === Number(month) && date.getFullYear() === Number(year)
  })
}

export function filterBetsByYear(bets, year) {
  return bets.filter(bet => {
    const date = new Date(bet.created_at || bet.data_partita)
    return date.getFullYear() === Number(year)
  })
}

export function monthProfitData(bets, year) {
  const names = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

  return names.map((name, index) => ({
    name,
    profitto: filterBetsByMonth(bets, index, year).reduce((sum, bet) => sum + betProfit(bet), 0)
  }))
}

export function championshipProfitRows(bets) {
  const map = new Map()

  for (const bet of bets) {
    const label = bet.campionato_label || bet.campionato || 'Altro'
    const current = map.get(label) || { label, profitto: 0, schedine: 0 }
    current.profitto += betProfit(bet)
    current.schedine += 1
    map.set(label, current)
  }

  return Array.from(map.values())
}
