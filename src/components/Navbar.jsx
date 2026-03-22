import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/',          label: 'Dashboard',       icon: '◈' },
  { to: '/expenses',  label: 'Expenses',         icon: '↓' },
  { to: '/income',    label: 'Income',           icon: '↑' },
  { to: '/remittance',label: 'Remittance',       icon: '₹' },
  { to: '/planner',   label: 'Monthly Planner',  icon: '⊟' },
  { to: '/grid',      label: 'Budget Grid',      icon: '⊞' },
  { to: '/settings',  label: 'Settings',         icon: '⚙' },
]

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <aside
      className="fixed top-0 left-0 h-full w-56 flex flex-col border-r border-border z-40"
      style={{ background: '#161B22' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl">¥</span>
          <span className="font-display font-bold text-lg tracking-tight text-white">YenFlow</span>
        </div>
        <p className="text-xs text-muted mt-1 font-mono truncate">
          {profile?.display_name || '—'}
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-danger hover:bg-red-500/5 transition-all"
        >
          <span className="text-base w-5 text-center">⏻</span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
