import { animate, motion, useMotionValue } from 'framer-motion'
import { useEffect, useState } from 'react'

export const rise = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
}

export function AnimatedNumber({ value, format = number => number.toFixed(0) }) {
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(motionValue, Number(value || 0), { duration: 0.9, ease: 'easeOut' })
    const unsubscribe = motionValue.on('change', latest => setDisplay(latest))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, motionValue])

  return format(display)
}

export function MetricCard({ label, value, format, tone = 'neutral', icon, delay = 0 }) {
  return (
    <motion.article
      className={`metric-card ${tone}`}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.38 }}
      whileHover={{ y: -3 }}
    >
      <div className="metric-label"><span>{label}</span>{icon && <b>{icon}</b>}</div>
      <strong><AnimatedNumber value={value} format={format} /></strong>
      <i />
    </motion.article>
  )
}

export function WeatherBadge({ weather, compact = false }) {
  return (
    <motion.div className={`weather-badge ${weather.tone} ${compact ? 'compact' : ''}`} whileHover={{ scale: 1.03 }}>
      <span>{weather.icon}</span>
      <div><strong>{weather.label}</strong>{!compact && <small>{weather.detail}</small>}</div>
    </motion.div>
  )
}

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="section-title">
      <div>{eyebrow && <small>{eyebrow}</small>}<h2>{title}</h2></div>
      {action}
    </div>
  )
}

export function Panel({ children, className = '', delay = 0 }) {
  return <motion.section className={`premium-panel ${className}`} {...rise} transition={{ ...rise.transition, delay }}>{children}</motion.section>
}
