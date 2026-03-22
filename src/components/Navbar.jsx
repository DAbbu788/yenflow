import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/',           label: 'Dashboard',      icon: '◈', mobileLabel: 'Home'      },
  { to: '/expenses',   label: 'Expenses',        icon: '↓', mobileLabel: 'Expenses'  },
  { to: '/income',     label: 'Income',          icon: '↑', mobileLabel: 'Income'    },
  { to: '/remittance', label: 'Remittance',      icon: '₹', mobileLabel: '₹ Send'   },
  { to: '/planner',    label: 'Monthly Planner', icon: '⊟', mobileLabel: 'Planner'  },
  { to: '/grid',       label: 'Budget Grid',     icon: '⊞', mobileLabel: 'Grid'     },
  { to: '/settings',   label: 'Settings',        icon: '⚙', mobileLabel: 'Settings' },
]

// Only show 5 items in bottom tab bar — most important ones
const mobileNav = [
  { to: '/',           label: 'Home',     icon: '◈' },
  { to: '/expenses',   label: 'Expenses', icon: '↓' },
  { to: '/income',     label: 'Income',   icon: '↑' },
  { to: '/planner',    label: 'Planner',  icon: '⊟' },
  { to: '/settings',   label: 'More',     icon: '⚙' },
]

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-full w-56 flex-col border-r border-border z-40"
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

      {/* ── Mobile bottom tab bar ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border"
        style={{ background: '#161B22' }}
      >
        <div className="flex items-stretch">
          {mobileNav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs transition-all ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="text-lg leading-none flex items-center justify-center w-8 h-7 rounded-xl transition-all"
                    style={{ background: isActive ? 'rgba(240,180,41,0.12)' : 'transparent' }}
                  >
                    {icon}
                  </span>
                  <span className="font-mono text-[10px] tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Mobile top header bar ─────────────────────────── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 border-b border-border"
        style={{ background: '#161B22', height: 52 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-accent">¥</span>
          <span className="font-display font-bold text-base text-white">YenFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted font-mono truncate max-w-24">
            {profile?.display_name || ''}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs text-muted hover:text-white px-2 py-1 rounded-lg border border-border transition-all"
          >
            Sign out
          </button>
        </div>
      </header>
    </>
  )
}
