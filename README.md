# BetTracker

Dashboard React + Firebase Auth + Neon Postgres + Vercel Cron per tracciare schedine, profitto, statistiche, amici e chiusura automatica.

## Avvio locale

```bash
npm install
npm run dev
```

Apri `http://localhost:5173`.

## Firebase Auth

Nel progetto Firebase abilita Authentication con email/password. Non serve creare altri database Firebase.

Poi inserisci nel file `.env` i valori della tua Web App Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Neon Database

Inserisci nel file `.env` la connection string Neon:

```env
DATABASE_URL=postgresql://...
```

Le API creano automaticamente le tabelle necessarie alla prima chiamata.

## Vercel Cron

Su Vercel aggiungi queste variabili ambiente:

```env
FOOTBALL_DATA_TOKEN=
CRON_SECRET=
DATABASE_URL=
```

Il cron gratuito e' configurato in `vercel.json` e chiama `/api/cron` ogni giorno alle 06:00 UTC.

L'app puo' anche aggiornare un campionato dal pulsante "Aggiorna partite", usando `/api/sync-matches`.

## Chiusura Automatica

Quando Football-Data restituisce una partita finita, l'API aggiorna `matches`, controlla le schedine collegate tramite `match_id` e le segna come `vinta` o `persa` quando il pronostico e' interpretabile.

## Installazione Su iPhone

Quando il sito e' online:

1. Aprilo da Safari su iPhone.
2. Tocca Condividi.
3. Tocca `Aggiungi alla schermata Home`.
4. Aprilo come app.
