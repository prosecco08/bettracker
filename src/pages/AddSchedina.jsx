import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { COMPETITIONS, PREDICTION_GROUPS } from '../data/competitions'
import { money, signedMoney } from '../lib/betStats'
import { addBet, listMatches, syncMatches as syncCompetitionMatches } from '../lib/data'

const DETAIL_REQUIRED = new Set(['Risultato esatto', 'Marcatore', 'Altro'])

function readableApiError(apiError) {
  if (!apiError) return ''

  if (apiError.status === 429) {
    const wait = apiError.detail?.match(/Wait\s+(\d+)\s+seconds/i)?.[1]
    return wait
      ? `Football-Data ha raggiunto il limite richieste. Aspetta ${wait} secondi e riprova.`
      : 'Football-Data ha raggiunto il limite richieste. Aspetta un momento e riprova.'
  }

  return `Football-Data ha risposto ${apiError.status} per ${apiError.competition}. ${apiError.detail || 'Controlla piano API e token.'}`
}

export default function AddSchedina({ onSaved }) {
  const { user } = useAuth()
  const [campionato, setCampionato] = useState('PL')
  const [matches, setMatches] = useState([])
  const [matchId, setMatchId] = useState('manual')
  const [manualMatch, setManualMatch] = useState('')
  const [categoriaPronostico, setCategoriaPronostico] = useState('Esito partita')
  const [mercatoPronostico, setMercatoPronostico] = useState('1X2')
  const [pronostico, setPronostico] = useState('1')
  const [dettaglio, setDettaglio] = useState('')
  const [puntata, setPuntata] = useState('2')
  const [quota, setQuota] = useState('2.50')
  const [message, setMessage] = useState('')
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [syncingMatches, setSyncingMatches] = useState(false)
  const [saving, setSaving] = useState(false)

  const mercatiDisponibili = PREDICTION_GROUPS[categoriaPronostico] || {}
  const pronosticiDisponibili = mercatiDisponibili[mercatoPronostico] || []
  const selected = matches.find(match => match.id === matchId)
  const stake = Number(puntata || 0)
  const odd = Number(quota || 0)
  const vincita = useMemo(() => stake * odd, [stake, odd])
  const profittoPotenziale = vincita - stake
  const needsDetail = DETAIL_REQUIRED.has(pronostico)

  async function loadMatches() {
    setLoadingMatches(true)

    const from = new Date().toISOString().slice(0, 10)
    const toDate = new Date()
    toDate.setDate(toDate.getDate() + 90)
    const to = toDate.toISOString().slice(0, 10)

    try {
      const data = await listMatches(campionato, from, to)
      setMatches(data)
      setMatchId(data?.[0]?.id || 'manual')
    } catch (error) {
      setMessage(`Non riesco a leggere le partite salvate: ${error.message}`)
    }

    setLoadingMatches(false)
  }

  async function syncMatches() {
    setMessage('')
    setSyncingMatches(true)

    const data = await syncCompetitionMatches(campionato).catch(error => ({ ok: false, error: error.message }))

    setSyncingMatches(false)

    if (data?.ok === false) {
      setMessage(data?.error || 'Non riesco ad aggiornare le partite. Controlla API Vercel e FOOTBALL_DATA_TOKEN.')
      return
    }

    await loadMatches()
    const count = data?.inserted_or_updated || 0
    const apiError = data?.api_errors?.[0]
    if (apiError) {
      setMessage(readableApiError(apiError))
      return
    }
    setMessage(count > 0 ? `Partite aggiornate: ${count}.` : `Aggiornamento completato per ${data?.competition || campionato}, ma Football-Data non ha restituito partite tra ${data?.date_from || 'oggi'} e ${data?.date_to || 'i prossimi 90 giorni'}.`)
  }

  useEffect(() => {
    loadMatches()
  }, [campionato])

  useEffect(() => {
    const firstMarket = Object.keys(PREDICTION_GROUPS[categoriaPronostico] || {})[0] || ''
    setMercatoPronostico(firstMarket)
  }, [categoriaPronostico])

  useEffect(() => {
    setPronostico(pronosticiDisponibili[0] || '')
    setDettaglio('')
  }, [mercatoPronostico, categoriaPronostico])

  function readablePrediction() {
    if (needsDetail && dettaglio.trim()) {
      return `${categoriaPronostico} - ${mercatoPronostico} - ${pronostico}: ${dettaglio.trim()}`
    }

    return `${categoriaPronostico} - ${mercatoPronostico} - ${pronostico}`
  }

  async function save(e) {
    e.preventDefault()
    setMessage('')

    const label = COMPETITIONS.find(c => c.value === campionato)?.label || campionato
    const partita = selected ? `${selected.home_team} vs ${selected.away_team}` : manualMatch.trim()
    const data_partita = selected ? selected.utc_date : new Date().toISOString().slice(0, 10)

    if (!partita) {
      setMessage('Inserisci una partita manuale oppure scegli una partita dalla lista.')
      return
    }

    if (needsDetail && !dettaglio.trim()) {
      setMessage('Aggiungi il dettaglio del pronostico speciale.')
      return
    }

    if (!Number.isFinite(stake) || stake <= 0) {
      setMessage('La puntata deve essere maggiore di zero.')
      return
    }

    if (!Number.isFinite(odd) || odd < 1) {
      setMessage('La quota totale deve essere almeno 1.00.')
      return
    }

    setSaving(true)
    const payload = {
      user_id: user.uid,
      campionato,
      campionato_label: label,
      partita,
      data_partita,
      pronostico: readablePrediction(),
      puntata: stake,
      quota: odd,
      stato: 'in_corso'
    }

    if (selected) payload.match_id = selected.id

    let error = null
    await addBet(payload).catch(saveError => {
      error = saveError
    })

    setSaving(false)

    if (error) setMessage(error.message)
    else onSaved()
  }

  return (
    <section className="page with-nav">
      <header className="plain-head">
        <small>BET BUILDER</small>
        <h1>Nuova schedina</h1>
        <p>Registra la giocata. Al resto pensano gli analytics.</p>
      </header>

      <form className="form-card" onSubmit={save}>
        <label>Campionato</label>
        <select value={campionato} onChange={e => setCampionato(e.target.value)}>
          {COMPETITIONS.map(competition => (
            <option key={competition.value} value={competition.value}>{competition.label}</option>
          ))}
        </select>

        <label>Partita</label>
        <button className="secondary-button" type="button" onClick={syncMatches} disabled={syncingMatches || loadingMatches || campionato === 'OTHER'}>
          {syncingMatches ? 'Aggiornamento partite...' : 'Aggiorna partite del campionato'}
        </button>
        {campionato === 'OTHER' && <p className="helper-text">Per Altro usa l'inserimento manuale.</p>}
        {!loadingMatches && matches.length === 0 && campionato !== 'OTHER' && (
          <p className="helper-text">Nessuna partita salvata per questo campionato nei prossimi 90 giorni. Tocca Aggiorna partite.</p>
        )}
        <select value={matchId} onChange={e => setMatchId(e.target.value)}>
          {matches.map(match => (
            <option key={match.id} value={match.id}>
              {match.home_team} vs {match.away_team} - {new Date(match.utc_date).toLocaleDateString('it-IT')}
            </option>
          ))}
          <option value="manual">{loadingMatches ? 'Caricamento partite...' : 'Inserisci manualmente'}</option>
        </select>

        {matchId === 'manual' && (
          <input
            value={manualMatch}
            onChange={e => setManualMatch(e.target.value)}
            placeholder="Es. Italia vs Spagna"
            required
          />
        )}

        <label>Categoria scommessa</label>
        <select value={categoriaPronostico} onChange={e => setCategoriaPronostico(e.target.value)}>
          {Object.keys(PREDICTION_GROUPS).map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>

        <label>Mercato</label>
        <select value={mercatoPronostico} onChange={e => setMercatoPronostico(e.target.value)}>
          {Object.keys(mercatiDisponibili).map(market => (
            <option key={market} value={market}>{market}</option>
          ))}
        </select>

        <label>Pronostico specifico</label>
        <select value={pronostico} onChange={e => setPronostico(e.target.value)}>
          {pronosticiDisponibili.map(prediction => (
            <option key={prediction} value={prediction}>{prediction}</option>
          ))}
        </select>

        {needsDetail && (
          <>
            <label>Dettaglio pronostico</label>
            <input
              value={dettaglio}
              onChange={e => setDettaglio(e.target.value)}
              placeholder={pronostico === 'Risultato esatto' ? 'Es. 2-1' : pronostico === 'Marcatore' ? 'Es. Lautaro Martinez' : 'Scrivi il dettaglio'}
              required
            />
          </>
        )}

        <div className="form-row">
          <div>
            <label>Puntata</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={puntata}
              onChange={e => setPuntata(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Quota totale</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={quota}
              onChange={e => setQuota(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="calc-box">
          <span>Vincita potenziale</span>
          <strong>{money(vincita)}</strong>
          <span>Profitto potenziale</span>
          <strong className="accent">{signedMoney(profittoPotenziale)}</strong>
        </div>

        <button disabled={saving}>{saving ? 'Salvataggio...' : 'Salva schedina'}</button>

        {message && <p className="form-message">{message}</p>}
      </form>
    </section>
  )
}
