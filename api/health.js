import { rawQuery } from './db.js'

function maskDatabaseUrl(value) {
  if (!value) return null

  try {
    const url = new URL(value)
    return {
      protocol: url.protocol,
      host: url.host,
      database: url.pathname.replace('/', ''),
      hasPassword: Boolean(url.password),
      sslmode: url.searchParams.get('sslmode')
    }
  } catch (_error) {
    return { invalid: true, startsWith: value.slice(0, 12) }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const databaseUrl = process.env.DATABASE_URL?.trim()
  const result = {
    ok: true,
    env: {
      hasDatabaseUrl: Boolean(databaseUrl),
      databaseUrl: maskDatabaseUrl(databaseUrl),
      hasFootballDataToken: Boolean(process.env.FOOTBALL_DATA_TOKEN),
      hasFirebaseApiKey: Boolean(process.env.VITE_FIREBASE_API_KEY),
      hasFirebaseProjectId: Boolean(process.env.VITE_FIREBASE_PROJECT_ID)
    },
    database: {
      ok: false
    }
  }

  try {
    const dbResult = await rawQuery('select now() as now')
    result.database = { ok: true, now: dbResult.rows[0].now }
  } catch (error) {
    result.database = {
      ok: false,
      code: error.code || null,
      message: error.message || String(error)
    }
  }

  res.status(result.database.ok ? 200 : 500).json(result)
}
