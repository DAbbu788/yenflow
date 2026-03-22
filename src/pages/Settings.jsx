import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import CategoryManager from '../components/CategoryManager'
import Modal from '../components/Modal'

export default function Settings() {
  const { user, profile }  = useAuth()
  const { categories }     = useCategories()

  // Profile
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [nameSaved,   setNameSaved]   = useState(false)
  const [nameBusy,    setNameBusy]    = useState(false)

  // Budget defaults
  const [defaults, setDefaults]   = useState({})
  const [defBusy,  setDefBusy]    = useState(false)
  const [defSaved, setDefSaved]   = useState(false)

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false)

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name)
  }, [profile])

  useEffect(() => {
    if (!user) return
    supabase.from('budget_defaults')
      .select('category_name, monthly_amount')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(r => { map[r.category_name] = r.monthly_amount })
        setDefaults(map)
      })
  }, [user, categories])

  async function saveName() {
    if (!displayName.trim()) return
    setNameBusy(true)
    await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', user.id)
    setNameBusy(false); setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  async function saveDefaults() {
    setDefBusy(true)
    const rows = Object.entries(defaults).map(([category_name, monthly_amount]) => ({
      user_id: user.id,
      category_name,
      monthly_amount: Number(monthly_amount) || 0,
      updated_at: new Date().toISOString(),
    }))
    await supabase.from('budget_defaults')
      .upsert(rows, { onConflict: 'user_id,category_name' })
    setDefBusy(false); setDefSaved(true)
    setTimeout(() => setDefSaved(false), 2000)
  }

  function fmtAnnual(monthly) {
    const v = Number(monthly) || 0
    return v > 0 ? `¥${(v*12).toLocaleString()}/yr` : ''
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
        <p className="text-muted text-sm mt-0.5">Manage your profile, categories, and default budgets</p>
      </div>

      {/* Profile */}
      <section className="rounded-2xl border border-border p-6" style={{ background:'#161B22' }}>
        <h2 className="font-display font-semibold text-white mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Email</label>
            <input value={user?.email || ''} disabled
              className="opacity-50 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Display Name</label>
            <div className="flex gap-3">
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Your name" />
              <button onClick={saveName} disabled={nameBusy}
                className="px-5 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all"
                style={{ background: nameSaved ? 'rgba(63,185,80,0.15)' : '#F0B429',
                         color: nameSaved ? '#3FB950' : '#0D1117',
                         border: nameSaved ? '1px solid rgba(63,185,80,0.3)' : 'none' }}>
                {nameSaved ? '✓ Saved' : nameBusy ? '…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="rounded-2xl border border-border p-6" style={{ background:'#161B22' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-white">Categories</h2>
            <p className="text-muted text-xs mt-0.5">{categories.length} categories</p>
          </div>
          <button onClick={() => setShowCatModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-border text-muted hover:text-white hover:border-accent transition-all">
            Manage →
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <span key={c.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-border">
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              {c.name}
            </span>
          ))}
        </div>
      </section>

      {/* Default budgets */}
      <section className="rounded-2xl border border-border p-6" style={{ background:'#161B22' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-semibold text-white">Default Monthly Budgets</h2>
          <button onClick={saveDefaults} disabled={defBusy}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0"
            style={{ background: defSaved ? 'rgba(63,185,80,0.15)' : '#F0B429',
                     color: defSaved ? '#3FB950' : '#0D1117',
                     border: defSaved ? '1px solid rgba(63,185,80,0.3)' : 'none' }}>
            {defSaved ? '✓ Saved' : defBusy ? 'Saving…' : 'Save Defaults'}
          </button>
        </div>
        <p className="text-xs text-muted mb-5">
          These are used to pre-fill the Budget Grid when you start a new year.
        </p>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-44 flex-shrink-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="text-sm text-white/80 truncate">{cat.name}</span>
              </div>
              <input
                type="number"
                min="0"
                value={defaults[cat.name] ?? ''}
                onChange={e => setDefaults(d => ({ ...d, [cat.name]: e.target.value }))}
                placeholder="0"
                className="text-sm text-center"
                style={{ maxWidth: 120 }}
              />
              <span className="text-xs text-muted font-mono w-28 flex-shrink-0">
                {fmtAnnual(defaults[cat.name])}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Account danger zone */}
      <section className="rounded-2xl border border-red-500/20 p-6" style={{ background:'rgba(248,81,73,0.03)' }}>
        <h2 className="font-display font-semibold text-red-400 mb-2">Account</h2>
        <p className="text-xs text-muted mb-4">
          Your email is <span className="text-white">{user?.email}</span>.
          To change your password, use the "Forgot password" flow on the login page.
        </p>
        <div className="text-xs text-muted p-3 rounded-lg border border-border" style={{ background:'#161B22' }}>
          <strong className="text-white">Phase 2 coming soon:</strong> Add friends, split expenses, and track peer borrowing/paybacks.
        </div>
      </section>

      {/* Category manager modal */}
      {showCatModal && (
        <Modal title="Manage Categories" onClose={() => setShowCatModal(false)}>
          <CategoryManager />
        </Modal>
      )}
    </div>
  )
}
