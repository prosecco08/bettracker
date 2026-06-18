import { randomUUID } from 'node:crypto'
import { query } from './db.js'

function ok(res, body = {}) {
  res.status(200).json({ ok: true, ...body })
}

function fail(res, error, status = 500) {
  const message = error.message || String(error)
  if (message.includes('ENOTFOUND') || message.includes('ECONNREFUSED')) {
    res.status(status).json({
      ok: false,
      error: 'Database Neon non raggiungibile. Controlla che DATABASE_URL su Vercel sia la connection string completa di Neon.'
    })
    return
  }

  if (message.includes('Missing DATABASE_URL')) {
    res.status(status).json({
      ok: false,
      error: 'DATABASE_URL mancante su Vercel.'
    })
    return
  }

  if (message.includes('Invalid DATABASE_URL')) {
    res.status(status).json({
      ok: false,
      error: 'DATABASE_URL non valida su Vercel. Il valore deve iniziare con postgresql://'
    })
    return
  }

  res.status(status).json({ ok: false, error: message })
}

function betProfit(bet, stato = bet.stato) {
  const stake = Number(bet.puntata || 0)
  const potentialWin = Number(bet.vincita_potenziale || (stake * Number(bet.quota || 0)))
  if (stato === 'vinta') return potentialWin - stake
  if (stato === 'persa') return -stake
  return 0
}

function normalizeUsername(username) {
  return String(username || '').trim().replace(/^@/, '').toLowerCase()
}

function pairId(a, b) {
  return [a, b].sort().join('_')
}

function mapBet(row) {
  return {
    ...row,
    puntata: Number(row.puntata || 0),
    quota: Number(row.quota || 0),
    vincita_potenziale: Number(row.vincita_potenziale || 0),
    profitto: Number(row.profitto || 0),
    matches: row.match_home_score === null && row.match_away_score === null ? null : {
      home_score: row.match_home_score,
      away_score: row.match_away_score,
      status: row.match_status
    }
  }
}

function summarizeBets(bets) {
  const totalStake = bets.reduce((sum, bet) => sum + Number(bet.puntata || 0), 0)
  const totalWins = bets.filter(bet => bet.stato === 'vinta').reduce((sum, bet) => sum + Number(bet.vincita_potenziale || 0), 0)
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
    winRate: closed ? (won / closed) * 100 : 0,
    roi: totalStake ? (totalProfit / totalStake) * 100 : 0
  }
}

function filterBetsByMonth(bets, month, year) {
  return bets.filter(bet => {
    const date = new Date(bet.created_at || bet.data_partita)
    return date.getMonth() === Number(month) && date.getFullYear() === Number(year)
  })
}

function leaderboardForm(bets) {
  const closed = bets
    .filter(bet => bet.stato === 'vinta' || bet.stato === 'persa')
    .sort((a, b) => new Date(a.created_at || a.data_partita) - new Date(b.created_at || b.data_partita))
  const lastStatus = closed.at(-1)?.stato
  let tail = 0
  for (let index = closed.length - 1; index >= 0 && closed[index].stato === lastStatus; index -= 1) tail += 1

  const threshold = new Date()
  threshold.setHours(0, 0, 0, 0)
  threshold.setDate(threshold.getDate() - 6)
  const recentProfit = bets
    .filter(bet => new Date(bet.created_at || bet.data_partita) >= threshold)
    .reduce((sum, bet) => sum + betProfit(bet), 0)

  return {
    current_wins: lastStatus === 'vinta' ? tail : 0,
    current_losses: lastStatus === 'persa' ? tail : 0,
    recent_profit: recentProfit
  }
}

async function allProfiles() {
  const result = await query('select * from profiles order by username asc')
  return result.rows
}

async function allBets() {
  const result = await query('select * from schedine')
  return result.rows.map(row => ({
    ...row,
    puntata: Number(row.puntata || 0),
    quota: Number(row.quota || 0),
    vincita_potenziale: Number(row.vincita_potenziale || 0),
    profitto: Number(row.profitto || 0)
  }))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    fail(res, new Error('Method not allowed'), 405)
    return
  }

  const { action, payload = {} } = req.body || {}

  try {
    if (action === 'getProfile') {
      const result = await query('select * from profiles where id = $1', [payload.userId])
      ok(res, { profile: result.rows[0] || null })
      return
    }

    if (action === 'createProfile') {
      const username = normalizeUsername(payload.username || payload.email?.split('@')[0] || 'utente')
      await query(
        `insert into profiles (id, username)
         values ($1, $2)
         on conflict (id) do update set username = excluded.username`,
        [payload.userId, username]
      )
      const result = await query('select * from profiles where id = $1', [payload.userId])
      ok(res, { profile: result.rows[0] })
      return
    }

    if (action === 'getUserByUsername') {
      const result = await query('select * from profiles where lower(username) = $1 limit 1', [normalizeUsername(payload.username)])
      ok(res, { profile: result.rows[0] || null })
      return
    }

    if (action === 'listBets') {
      const result = await query(
        `select s.*, m.home_score as match_home_score, m.away_score as match_away_score, m.status as match_status
         from schedine s
         left join matches m on m.id = s.match_id
         where s.user_id = $1`,
        [payload.userId]
      )
      const bets = result.rows.map(mapBet).sort((a, b) => {
        const left = new Date(a.created_at || a.data_partita)
        const right = new Date(b.created_at || b.data_partita)
        return payload.direction === 'asc' ? left - right : right - left
      })
      ok(res, { bets })
      return
    }

    if (action === 'addBet') {
      const id = randomUUID()
      const vincita = Number(payload.puntata || 0) * Number(payload.quota || 0)
      const row = { ...payload, id, vincita_potenziale: vincita, profitto: betProfit({ ...payload, vincita_potenziale: vincita }) }
      await query(
        `insert into schedine
          (id, user_id, match_id, campionato, campionato_label, partita, data_partita, pronostico, puntata, quota, vincita_potenziale, stato, profitto)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [row.id, row.user_id, row.match_id || null, row.campionato, row.campionato_label, row.partita, row.data_partita, row.pronostico, row.puntata, row.quota, row.vincita_potenziale, row.stato, row.profitto]
      )
      ok(res, { id })
      return
    }

    if (action === 'updateBetStatus') {
      const current = await query('select * from schedine where id = $1 and user_id = $2', [payload.id, payload.userId])
      if (!current.rows[0]) throw new Error('Schedina non trovata')
      const profitto = betProfit(current.rows[0], payload.stato)
      await query('update schedine set stato = $1, profitto = $2, updated_at = now() where id = $3 and user_id = $4', [payload.stato, profitto, payload.id, payload.userId])
      ok(res)
      return
    }

    if (action === 'deleteBet') {
      await query('delete from schedine where id = $1 and user_id = $2', [payload.id, payload.userId])
      ok(res)
      return
    }

    if (action === 'listMatches') {
      const result = await query(
        `select * from matches
         where competition_code = $1 and utc_date >= $2 and utc_date <= $3
         order by utc_date asc`,
        [payload.competitionCode, payload.fromDate, payload.toDate]
      )
      ok(res, { matches: result.rows })
      return
    }

    if (action === 'getGoal') {
      const result = await query('select * from user_goals where user_id = $1 and month = $2 and year = $3', [payload.userId, payload.month, payload.year])
      ok(res, { goal: result.rows[0] || null })
      return
    }

    if (action === 'saveGoal') {
      const id = `${payload.userId}_${payload.year}_${payload.month}`
      await query(
        `insert into user_goals (id, user_id, month, year, target_profit)
         values ($1,$2,$3,$4,$5)
         on conflict (user_id, month, year)
         do update set target_profit = excluded.target_profit, updated_at = now()`,
        [id, payload.userId, payload.month, payload.year, payload.targetProfit]
      )
      ok(res)
      return
    }

    if (action === 'leaderboard') {
      const profiles = await allProfiles()
      const bets = await allBets()
      const leaderboard = profiles.map(profile => {
        const userBets = bets.filter(bet => bet.user_id === profile.id)
        const stats = summarizeBets(userBets)
        return {
          ...profile,
          ...leaderboardForm(userBets),
          totale_schedine: userBets.length,
          totale_puntato: stats.totalStake,
          totale_vincite: stats.totalWins,
          profitto_totale: stats.totalProfit,
          vinte: stats.won,
          perse: stats.lost,
          in_corso: stats.pending,
          win_rate: stats.winRate,
          roi: stats.roi
        }
      }).sort((a, b) => b.profitto_totale - a.profitto_totale)
      ok(res, { leaderboard })
      return
    }

    if (action === 'monthlyChallenge') {
      const profiles = await allProfiles()
      const bets = await allBets()
      const monthly = profiles.map(profile => {
        const monthBets = filterBetsByMonth(bets.filter(bet => bet.user_id === profile.id), Number(payload.month) - 1, Number(payload.year))
        const stats = summarizeBets(monthBets)
        return { ...profile, schedine_mese: monthBets.length, profitto_mese: stats.totalProfit }
      }).filter(row => row.schedine_mese > 0).sort((a, b) => b.profitto_mese - a.profitto_mese)
      ok(res, { monthly })
      return
    }

    if (action === 'listFriendships') {
      const result = await query('select * from friendships where requester_id = $1 or addressee_id = $1 order by created_at desc', [payload.userId])
      ok(res, { friendships: result.rows })
      return
    }

    if (action === 'sendFriendRequest') {
      const id = pairId(payload.userId, payload.targetId)
      await query(
        `insert into friendships (id, requester_id, addressee_id, status)
         values ($1,$2,$3,'pending')
         on conflict (id) do nothing`,
        [id, payload.userId, payload.targetId]
      )
      ok(res)
      return
    }

    if (action === 'updateFriendshipStatus') {
      await query('update friendships set status = $1, updated_at = now() where id = $2 and addressee_id = $3', [payload.status, payload.id, payload.userId])
      ok(res)
      return
    }

    if (action === 'getProfilesByIds') {
      if (!payload.ids?.length) {
        ok(res, { profiles: [] })
        return
      }
      const result = await query('select * from profiles where id = any($1)', [payload.ids])
      ok(res, { profiles: result.rows })
      return
    }

    fail(res, new Error('Azione non supportata'), 400)
  } catch (error) {
    fail(res, error)
  }
}
