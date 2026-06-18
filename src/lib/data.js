const REQUEST_TIMEOUT_MS = 25000

async function requestJson(path, body) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Il server sta impiegando troppo tempo a rispondere. Riprova tra poco.')
    }
    throw new Error('Il server non è raggiungibile. Controlla la connessione e riprova.')
  } finally {
    clearTimeout(timeout)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      res.ok
        ? 'Il server ha restituito una risposta non valida. Riavvia o ridistribuisci l\'applicazione.'
        : `Servizio dati non disponibile (errore ${res.status}).`
    )
  }

  let data
  try {
    data = await res.json()
  } catch (_error) {
    throw new Error('Il server ha restituito dati non validi. Riprova tra poco.')
  }
  if (!res.ok || !data.ok) throw new Error(data.error || `Operazione non riuscita (errore ${res.status})`)
  return data
}

async function api(action, payload = {}) {
  return requestJson('/api/data', { action, payload })
}

export async function getProfile(userId) {
  const data = await api('getProfile', { userId })
  return data.profile
}

export async function createProfile(user, username) {
  const data = await api('createProfile', {
    userId: user.uid,
    email: user.email,
    username
  })
  return data.profile
}

export async function listBets(userId, direction = 'desc') {
  const data = await api('listBets', { userId, direction })
  return data.bets
}

export async function addBet(payload) {
  const data = await api('addBet', payload)
  return data.id
}

export async function updateBetStatus(userId, id, stato) {
  await api('updateBetStatus', { userId, id, stato })
}

export async function deleteBet(userId, id) {
  await api('deleteBet', { userId, id })
}

export async function listMatches(competitionCode, fromDate, toDate) {
  const data = await api('listMatches', { competitionCode, fromDate, toDate })
  return data.matches
}

export async function syncMatches(competitionCode) {
  return requestJson('/api/sync-matches', { competition: competitionCode })
}

export async function autoCloseFinishedBets() {
  return requestJson('/api/sync-matches', {})
}

export async function getGoal(userId, month, year) {
  const data = await api('getGoal', { userId, month, year })
  return data.goal
}

export async function saveGoal(userId, month, year, targetProfit) {
  await api('saveGoal', { userId, month, year, targetProfit })
}

export async function getLeaderboard() {
  const data = await api('leaderboard')
  return data.leaderboard
}

export async function getMonthlyChallenge(month, year) {
  const data = await api('monthlyChallenge', { month, year })
  return data.monthly
}

export async function getUserByUsername(username) {
  const data = await api('getUserByUsername', { username })
  return data.profile
}

export async function listFriendships(userId) {
  const data = await api('listFriendships', { userId })
  return data.friendships
}

export async function sendFriendRequest(userId, targetId) {
  await api('sendFriendRequest', { userId, targetId })
}

export async function updateFriendshipStatus(userId, id, status) {
  await api('updateFriendshipStatus', { userId, id, status })
}

export async function getProfilesByIds(ids) {
  const data = await api('getProfilesByIds', { ids })
  return Object.fromEntries(data.profiles.map(profile => [profile.id, profile]))
}
