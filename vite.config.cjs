const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const { VitePWA } = require('vite-plugin-pwa')
const { pathToFileURL } = require('url')
const path = require('path')
const fs = require('fs')

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, '.env')
  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index)
    const value = trimmed.slice(index + 1)
    if (!process.env[key]) process.env[key] = value
  }
}

loadLocalEnv()

function localApiPlugin() {
  async function parseBody(req) {
    if (req.method === 'GET') return undefined

    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks).toString('utf8')
    if (!raw) return undefined

    try {
      return JSON.parse(raw)
    } catch (_error) {
      return undefined
    }
  }

  async function runApi(name, req, res) {
    req.body = await parseBody(req)
    req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries())
    res.status = code => {
      res.statusCode = code
      return res
    }
    res.json = body => {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(body))
    }

    const apiPath = pathToFileURL(path.resolve(__dirname, `api/${name}.js`)).href
    const mod = await import(`${apiPath}?t=${Date.now()}`)
    await mod.default(req, res)
  }

  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/data', (req, res) => runApi('data', req, res))
      server.middlewares.use('/api/sync-matches', (req, res) => runApi('sync-matches', req, res))
      server.middlewares.use('/api/cron', (req, res) => runApi('cron', req, res))
    }
  }
}

module.exports = defineConfig({
  plugins: [
    localApiPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-v2.png'],
      manifest: {
        name: 'BetTracker',
        short_name: 'BetTracker',
        description: 'Dashboard personale per tracciare schedine, profitto e risultati mensili',
        theme_color: '#181827',
        background_color: '#181827',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'] }
    })
  ]
})
