import { motion } from 'framer-motion'
import { betProfit, money, signedMoney } from '../lib/betStats'

const statusLabels = { in_corso: 'Live', vinta: 'Vinta', persa: 'Persa' }

export default function BetCard({ bet, onStatus, onDelete }) {
  const profit = betProfit(bet)
  const potentialWin = Number(bet.vincita_potenziale || 0)
  const match = Array.isArray(bet.matches) ? bet.matches[0] : bet.matches
  const hasResult = match?.home_score !== null && match?.home_score !== undefined && match?.away_score !== null && match?.away_score !== undefined

  return (
    <motion.article
      className={`bet-card bet-${bet.stato}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      whileHover={{ y: -3 }}
    >
      <div className="bet-top">
        <span className="chip">{bet.campionato_label || bet.campionato}</span>
        <span className={`status ${bet.stato}`}><i />{statusLabels[bet.stato] || 'Live'}</span>
      </div>

      <div className="bet-main">
        <div className="bet-copy">
          <small>{new Date(bet.data_partita).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
          <h3>{bet.partita}</h3>
          <p>{bet.pronostico}</p>
          {hasResult && <span className="match-result">Finale {match.home_score} - {match.away_score}</span>}
        </div>
        <strong className={`bet-profit ${profit < 0 ? 'negative' : 'accent'}`}>
          {bet.stato === 'in_corso' ? money(potentialWin) : signedMoney(profit)}
          <small>{bet.stato === 'in_corso' ? 'potenziale' : 'profitto'}</small>
        </strong>
      </div>

      <div className="bet-numbers">
        <span><small>Quota</small><b>{Number(bet.quota).toFixed(2)}</b></span>
        <span><small>Puntata</small><b>{money(bet.puntata)}</b></span>
        <span><small>Vincita pot.</small><b>{money(potentialWin)}</b></span>
      </div>

      {(onStatus || onDelete) && (
        <div className="status-actions">
          {onStatus && <>
            <motion.button whileTap={{ scale: 0.94 }} className={bet.stato === 'vinta' ? 'selected won' : ''} onClick={() => onStatus(bet.id, 'vinta')}>Vinta</motion.button>
            <motion.button whileTap={{ scale: 0.94 }} className={bet.stato === 'persa' ? 'selected lost' : ''} onClick={() => onStatus(bet.id, 'persa')}>Persa</motion.button>
            <motion.button whileTap={{ scale: 0.94 }} className={bet.stato === 'in_corso' ? 'selected live' : ''} onClick={() => onStatus(bet.id, 'in_corso')}>In corso</motion.button>
          </>}
          {onDelete && <motion.button whileTap={{ scale: 0.94 }} className="danger" onClick={() => onDelete(bet.id)}>Elimina</motion.button>}
        </div>
      )}
    </motion.article>
  )
}
