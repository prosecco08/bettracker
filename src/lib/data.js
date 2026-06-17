async function api(action, payload = {}) {
  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, payload })
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Operazione non riuscita')
  return data
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
  const res = await fetch('/api/sync-matches', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ competition: competitionCode })
  })
  return res.json()
}

export async function autoCloseFinishedBets() {
  const res = await fetch('/api/sync-matches', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({})
  })
  return res.json()
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
