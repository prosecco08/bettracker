const items = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'stats', label: 'Statistiche', icon: '▣' },
  { id: 'friends', label: 'Amici', icon: '◇' },
  { id: 'profile', label: 'Profilo', icon: '○' }
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => onChange(item.id)}>
          <span>{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  )
}
