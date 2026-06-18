import { motion } from 'framer-motion'

const paths = {
  home: 'M3 11.5 12 4l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5z M9 21v-7h6v7',
  stats: 'M4 19V10 M10 19V5 M16 19v-7 M22 19V8',
  friends: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M18 8a3 3 0 1 0 0-6 M22 20v-2a4 4 0 0 0-3-3.87',
  profile: 'M20 21a8 8 0 0 0-16 0 M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z'
}

const items = [
  { id: 'home', label: 'Home' },
  { id: 'stats', label: 'Statistiche' },
  { id: 'add', label: 'Nuova', add: true },
  { id: 'friends', label: 'Amici' },
  { id: 'profile', label: 'Profilo' }
]

function NavIcon({ id }) {
  if (id === 'add') return <span className="plus-icon">+</span>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[id]} /></svg>
}

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <motion.button
          key={item.id}
          className={`${active === item.id ? 'active' : ''} ${item.add ? 'add-nav' : ''}`}
          onClick={() => onChange(item.id)}
          whileTap={{ scale: 0.88 }}
        >
          <span className="nav-icon"><NavIcon id={item.id} /></span>
          <small>{item.label}</small>
          {active === item.id && !item.add && <motion.i layoutId="nav-glow" />}
        </motion.button>
      ))}
    </nav>
  )
}
