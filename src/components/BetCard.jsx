import { betProfit, money, signedMoney } from '../lib/betStats'

const statusLabels = { in_corso: 'In corso', vinta: 'Vinta', persa: 'Persa' }

export default function BetCard({ bet, onStatus, onDelete }) {
  const profit = betProfit(bet)
  const potentialProfit = Number(bet.vincita_potenziale || 0) - Number(bet.puntata || 0)
  const match = Array.isArray(bet.matches) ? bet.matches[0] : bet.matches
  const hasResult = match?.home_score !== null && match?.home_score !== undefined && match?.away_score !== null && match?.away_score !== undefined

  return (
    <article className="bet-card">
      <div className="bet-top">
        <span className="chip">{bet.campionato_label || bet.campionato}</span>
        <span className={`status ${bet.stato}`}>{statusLabels[bet.stato] || 'In corso'}</span>
      </div>

      <div className="bet-grid">
        <div>
          <h3>{bet.partita}</h3>
          <p>{bet.pronostico}</p>
          {hasResult && <small>Risultato {match.home_score}-{match.away_score}</small>}
          {bet.auto_close_reason && <small>Chiusura automatica: {bet.auto_close_reason}</small>}
          <small>Puntata {money(bet.puntata)}</small>
        </div>

        <div className="bet-money">
          <small>{new Date(bet.data_partita).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</small>
          <p>Quota {Number(bet.quota).toFixed(2)}</p>
          <strong className={profit < 0 ? 'negative' : 'accent'}>
            {bet.stato === 'in_corso' ? `Pot. ${signedMoney(potentialProfit)}` : signedMoney(profit)}
          </strong>
        </div>
      </div>

      <div className="status-actions">
        {onStatus && (
          <>
            <button className={bet.stato === 'vinta' ? 'selected' : ''} onClick={() => onStatus(bet.id, 'vinta')}>Vinta</button>
            <button className={bet.stato === 'persa' ? 'selected' : ''} onClick={() => onStatus(bet.id, 'persa')}>Persa</button>
            <button className={bet.stato === 'in_corso' ? 'selected' : ''} onClick={() => onStatus(bet.id, 'in_corso')}>In corso</button>
          </>
        )}
        {onDelete && <button className="danger" onClick={() => onDelete(bet.id)}>Elimina</button>}
      </div>
    </article>
  )
}
