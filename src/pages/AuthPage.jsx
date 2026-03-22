import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode,     setMode]     = useState('login')   // 'login' | 'register'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')
  const [busy,     setBusy]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    if (!email || !password) { setError('Email and password are required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, name)
        setInfo('Account created! Check your email to confirm, then sign in.')
        setMode('login')
      }
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-ink">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 p-10 border-r border-border"
        style={{ background: '#161B22' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <span className="text-4xl font-display font-bold text-accent">¥</span>
            <span className="text-2xl font-display font-bold text-white">YenFlow</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white leading-tight mb-4">
            Your money.<br />Your story.<br />In yen.
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            Track expenses, plan budgets month by month, monitor remittances home — all in one place built for Indians living in Japan.
          </p>
        </div>
        <div className="space-y-4">
          {[
            ['Multi-year budget planning',   'Plan differently for Golden Week, year-end, and every month in between.'],
            ['¥ → ₹ remittance tracking',    'Log every transfer home with exchange rates and see annual totals.'],
            ['Custom categories',            'Add, rename, or remove any category to match how you actually spend.'],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-3">
              <span className="text-accent text-lg mt-0.5 flex-shrink-0">◈</span>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-muted leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-3xl font-display font-bold text-accent">¥</span>
            <span className="text-xl font-display font-bold text-white">YenFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-muted text-sm">
              {mode === 'login' ? 'Sign in to your account' : 'Start tracking your finances'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-border p-1 mb-6" style={{ background: '#161B22' }}>
            {['login','register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setInfo('') }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={mode === m
                  ? { background: '#F0B429', color: '#0D1117' }
                  : { color: '#8B949E' }
                }
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 border border-red-500/20"
              style={{ background: 'rgba(248,81,73,0.08)' }}>
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-emerald-400 border border-emerald-500/20"
              style={{ background: 'rgba(63,185,80,0.08)' }}>
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl font-display font-bold text-sm transition-all mt-2"
              style={{
                background: busy ? '#8B949E' : '#F0B429',
                color: '#0D1117',
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              {busy
                ? 'Please wait…'
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            {mode === 'login'
              ? "Don't have an account? "
              : "Already have an account? "
            }
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setInfo('') }}
              className="text-accent hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
