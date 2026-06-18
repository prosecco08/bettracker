import { motion } from 'framer-motion'

export default function StatCard({ label, value, accent, negative }) {
  return (
    <motion.section className={`stat-card ${accent ? 'positive' : ''} ${negative ? 'loss' : ''}`} whileHover={{ y: -3 }}>
      <p>{label}</p>
      <strong>{value}</strong>
    </motion.section>
  )
}
