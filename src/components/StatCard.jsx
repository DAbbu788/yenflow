export default function StatCard({ label, value, sub, accent = false, color }) {
  return (
    <div
      className="rounded-2xl border border-border p-5 flex flex-col gap-1 anim-fade-up"
      style={{ background: accent ? 'rgba(240,180,41,0.06)' : '#161B22',
               borderColor: accent ? 'rgba(240,180,41,0.3)' : '#21262D' }}
    >
      <p className="text-xs font-mono uppercase tracking-widest text-muted">{label}</p>
      <p className="text-2xl font-display font-bold" style={{ color: color || (accent ? '#F0B429' : '#E6EDF3') }}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}
