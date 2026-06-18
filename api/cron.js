import { syncFootballData } from './sync-core.js'

function errorMessage(error) {
  const message = error.message || 'Sync failed'
  if (message.includes('ENOTFOUND') || message.includes('ECONNREFUSED')) {
    return 'Database Neon non raggiungibile. Controlla DATABASE_URL su Vercel.'
  }
  if (message.includes('Missing DATABASE_URL')) return 'DATABASE_URL mancante su Vercel.'
  if (message.includes('Invalid DATABASE_URL')) return 'DATABASE_URL non valida su Vercel. Deve iniziare con postgresql://'
  if (message.includes('Missing FOOTBALL_DATA_TOKEN')) return 'FOOTBALL_DATA_TOKEN mancante su Vercel.'
  return message
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return
  }

  try {
    res.status(200).json(await syncFootballData())
  } catch (error) {
    res.status(500).json({ ok: false, error: errorMessage(error) })
  }
}
