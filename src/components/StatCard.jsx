export default function StatCard({ label, value, accent }) {
  return <section className="stat-card"><p>{label}</p><strong className={accent ? 'accent' : ''}>{value}</strong></section>
}
