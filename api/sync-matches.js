import { syncFootballData } from './sync-core.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    const competition = req.body?.competition
    res.status(200).json(await syncFootballData(competition))
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Sync failed' })
  }
}
