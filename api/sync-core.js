import { query } from './db.js'

const DEFAULT_COMPETITIONS = [
  { code: 'SA', label: 'Serie A' },
  { code: 'PL', label: 'Premier League' },
  { code: 'PD', label: 'La Liga' },
  { code: 'BL1', label: 'Bundesliga' },
  { code: 'FL1', label: 'Ligue 1' },
  { code: 'CL', label: 'Champions League' },
  { code: 'WC', label: 'Mondiali' },
  { code: 'EC', label: 'Europei' }
]

function cleanPrediction(prediction) {
  return prediction
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function extractPick(prediction) {
  const parts = prediction.split(' - ')
  const rawPick = parts[parts.length - 1] || prediction
  return rawPick.split(':').pop()?.trim() || rawPick.trim()
}

function outcome(homeScore, awayScore) {
  if (homeScore > awayScore) return '1'
  if (homeScore < awayScore) return '2'
  return 'X'
}

function overUnderResult(pick, totalGoals) {
  const match = pick.match(/\b(over|under)\s+(\d+(?:\.\d+)?)\b/)
  if (!match) return null
  const line = Number(match[2])
  return match[1] === 'over' ? totalGoals > line : totalGoals < line
}

function betProfit(bet, stato) {
  const stake = Number(bet.puntata || 0)
  const potentialWin = Number(bet.vincita_potenziale || (stake * Number(bet.quota || 0)))
  if (stato === 'vinta') return potentialWin - stake
  if (stato === 'persa') return -stake
  return 0
}

function evaluatePick(pronostico, homeScore, awayScore) {
  if (homeScore === null || awayScore === null) return null

  const pick = cleanPrediction(extractPick(pronostico))
  const fullPrediction = cleanPrediction(pronostico)
  const finalOutcome = outcome(homeScore, awayScore)
  const totalGoals = homeScore + awayScore
  const hasGoal = homeScore > 0 && awayScore > 0

  if (/^\d+\s*-\s*\d+$/.test(pick)) {
    const [home, away] = pick.split('-').map(value => Number(value.trim()))
    return homeScore === home && awayScore === away
  }

  if (pick === '1') return finalOutcome === '1'
  if (pick === 'x') return finalOutcome === 'X'
  if (pick === '2') return finalOutcome === '2'
  if (pick === '1x') return finalOutcome === '1' || finalOutcome === 'X'
  if (pick === '12') return finalOutcome === '1' || finalOutcome === '2'
  if (pick === 'x2') return finalOutcome === 'X' || finalOutcome === '2'
  if (pick === '1 dnb') return finalOutcome === 'X' ? null : finalOutcome === '1'
  if (pick === '2 dnb') return finalOutcome === 'X' ? null : finalOutcome === '2'
  if (pick === 'goal' || pick === 'si') return hasGoal
  if (pick === 'no goal' || pick === 'no') return !hasGoal
  if (pick === 'casa segna' || pick === 'casa over 0.5') return homeScore > 0
  if (pick === 'ospite segna' || pick === 'ospite over 0.5') return awayScore > 0
  if (pick === 'casa no goal') return homeScore === 0
  if (pick === 'ospite no goal') return awayScore === 0
  if (pick === 'casa vince') return finalOutcome === '1'
  if (pick === 'ospite vince') return finalOutcome === '2'
  if (pick === 'casa over 1.5') return homeScore > 1.5
  if (pick === 'casa over 2.5') return homeScore > 2.5
  if (pick === 'ospite over 1.5') return awayScore > 1.5
  if (pick === 'ospite over 2.5') return awayScore > 2.5

  const overUnder = overUnderResult(pick, totalGoals)
  if (overUnder !== null) return overUnder

  const multigol = pick.match(/multigol\s+(\d+)-(\d+)/)
  if (multigol) {
    const min = Number(multigol[1])
    const max = Number(multigol[2])
    return totalGoals >= min && totalGoals <= max
  }

  if (pick.includes(' + ')) {
    return pick.split(' + ').every(part => {
      if (part === 'goal') return hasGoal
      if (part === 'no goal') return !hasGoal
      if (part === '1') return finalOutcome === '1'
      if (part === 'x') return finalOutcome === 'X'
      if (part === '2') return finalOutcome === '2'
      if (part === '1x') return finalOutcome === '1' || finalOutcome === 'X'
      if (part === '12') return finalOutcome === '1' || finalOutcome === '2'
      if (part === 'x2') return finalOutcome === 'X' || finalOutcome === '2'
      const partOverUnder = overUnderResult(part, totalGoals)
      return partOverUnder === null ? false : partOverUnder
    })
  }

  if (fullPrediction.includes('risultato esatto')) return false
  return null
}

async function closeFinishedBets(rows) {
  const finishedRows = rows.filter(row =>
    row.status === 'FINISHED' &&
    row.home_score !== null &&
    row.home_score !== undefined &&
    row.away_score !== null &&
    row.away_score !== undefined
  )

  if (!finishedRows.length) return { checked: 0, closed: 0, skipped: 0 }

  let checked = 0
  let closed = 0
  let skipped = 0

  for (const match of finishedRows) {
    const betsResult = await query(
      'select * from schedine where match_id = $1 and stato = $2',
      [match.id, 'in_corso']
    )

    for (const bet of betsResult.rows) {
      checked += 1
      const isWon = evaluatePick(String(bet.pronostico || ''), Number(match.home_score), Number(match.away_score))

      if (isWon === null) {
        skipped += 1
        continue
      }

      const stato = isWon ? 'vinta' : 'persa'
      await query(
        `update schedine
         set stato = $1,
             profitto = $2,
             auto_closed_at = now(),
             auto_close_reason = $3,
             updated_at = now()
         where id = $4`,
        [stato, betProfit(bet, stato), `Risultato finale ${match.home_score}-${match.away_score}`, bet.id]
      )
      closed += 1
    }
  }

  return { checked, closed, skipped }
}

export async function syncFootballData(selectedCode) {
  const token = process.env.FOOTBALL_DATA_TOKEN
  if (!token) throw new Error('Missing FOOTBALL_DATA_TOKEN')

  const competitions = selectedCode
    ? DEFAULT_COMPETITIONS.filter(competition => competition.code === selectedCode)
    : DEFAULT_COMPETITIONS

  if (selectedCode && competitions.length === 0) {
    throw new Error(`Campionato non supportato dall'API gratuita: ${selectedCode}`)
  }

  const from = new Date()
  from.setDate(from.getDate() - 7)
  const to = new Date()
  to.setDate(to.getDate() + 90)
  const dateFrom = from.toISOString().slice(0, 10)
  const dateTo = to.toISOString().slice(0, 10)
  const rows = []
  const apiErrors = []

  for (const competition of competitions) {
    const url = `https://api.football-data.org/v4/competitions/${competition.code}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
    const res = await fetch(url, { headers: { 'X-Auth-Token': token } })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      apiErrors.push({ competition: competition.code, status: res.status, detail: detail.slice(0, 240) })
      continue
    }

    const payload = await res.json()

    for (const match of payload.matches || []) {
      rows.push({
        id: String(match.id),
        external_id: String(match.id),
        competition_code: match.competition?.code || competition.code,
        competition_label: match.competition?.name || competition.label,
        competition_name: match.competition?.name || competition.label,
        home_team: match.homeTeam?.name || 'Casa',
        away_team: match.awayTeam?.name || 'Trasferta',
        utc_date: match.utcDate,
        status: match.status || 'SCHEDULED',
        home_score: match.score?.fullTime?.home ?? null,
        away_score: match.score?.fullTime?.away ?? null,
        updated_at: new Date().toISOString()
      })
    }
  }

  for (const row of rows) {
    await query(
      `insert into matches
        (id, external_id, competition_code, competition_label, competition_name, home_team, away_team, utc_date, status, home_score, away_score, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now())
       on conflict (id) do update set
        external_id = excluded.external_id,
        competition_code = excluded.competition_code,
        competition_label = excluded.competition_label,
        competition_name = excluded.competition_name,
        home_team = excluded.home_team,
        away_team = excluded.away_team,
        utc_date = excluded.utc_date,
        status = excluded.status,
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        updated_at = now()`,
      [row.id, row.external_id, row.competition_code, row.competition_label, row.competition_name, row.home_team, row.away_team, row.utc_date, row.status, row.home_score, row.away_score]
    )
  }

  const autoClose = await closeFinishedBets(rows)

  return {
    ok: true,
    competition: selectedCode || 'ALL',
    date_from: dateFrom,
    date_to: dateTo,
    inserted_or_updated: rows.length,
    auto_close: autoClose,
    api_errors: apiErrors
  }
}
