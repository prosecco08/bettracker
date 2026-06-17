import { syncFootballData } from './sync-core.js'

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
    res.status(500).json({ ok: false, error: error.message || 'Sync failed' })
  }
}
