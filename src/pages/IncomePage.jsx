import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'

const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SOURCES  = ['Salary','Freelance','Bonus','Investment Returns','Part-time','Rental Income','Other']
function fmt(n) { return `¥${Number(n||0).toLocaleString()}` }
const EMPTY = { year: new Date().getFullYear(), month: new Date().getMonth()+1, source:'Salary', amount:'', notes:'' }

export default function IncomePage() {
  const { user }                   = useAuth()
  const [rows,    setRows]          = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal,   setModal]         = useState(false)
  const [form,    setForm]          = useState(EMPTY)
  const [editing, setEditing]       = useState(null)
  const [error,   setError]         = useState('')
  const [busy,    setBusy]          = useState(false)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('income').select('*').eq('user_id', user.id).eq('year', filterYear).order('month').order('created_at')
    setRows(data ?? [])
    setLoading(false)
  }, [user, filterYear])

  useEffect(() => { load() }, [load])

  const annualTotal = rows.reduce((s,r) => s+Number(r.amount), 0)
  const monthSummary = MONTHS.map((label, i) => ({
    label, month: i+1,
    total: rows.filter(r => r.month === i+1).reduce((s,r) => s+Number(r.amount), 0)
  }))

  function openAdd()    { setForm({ ...EMPTY, year: filterYear }); setEditing(null); setError(''); setModal(true) }
  function openEdit(r)  { setForm({ year:r.year, month:r.month, source:r.source, amount:r.amount, notes:r.notes||'' }); setEditing(r.id); setError(''); setModal(true) }

  async function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) { setError('Amount must be greater than 0.'); return }
    setBusy(true); setError('')
    try {
      const payload = { ...form, amount: Number(form.amount), user_id: user.id }
      if (editing) { const { error:e } = await supabase.from('income').update(payload).eq('id', editing); if (e) throw e }
      else         { const { error:e } = await supabase.from('income').insert(payload);                   if (e) throw e }
      setModal(false); await load()
    } catch(e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this income entry?')) return
    await supabase.from('income').delete().eq('id', id)
    await load()
  }

  function f(k,v) { setForm(p => ({ ...p, [k]:v })) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-white">Income</h1>
          <p className="text-muted text-xs mt-0.5">Annual total: <span className="text-emerald-400 font-mono">{fmt(annualTotal)}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="text-sm w-20">
            {[2024,2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openAdd} className="px-3 py-2 rounded-xl font-display font-semibold text-sm" style={{ background:'#F0B429', color:'#0D1117' }}>+ Add</button>
        </div>
      </div>

      {/* Monthly strip */}
      <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
        {monthSummary.map(({ label, total }) => (
          <div key={label} className="rounded-xl border p-1.5 text-center"
            style={{ background: total > 0 ? 'rgba(63,185,80,0.06)' : '#161B22', borderColor: total > 0 ? 'rgba(63,185,80,0.25)' : '#21262D' }}>
            <p className="text-xs font-mono text-muted">{label}</p>
            <p className="text-xs font-bold mt-0.5" style={{ color: total > 0 ? '#3FB950' : '#21262D' }}>
              {total > 0 ? `${(total/1000).toFixed(0)}K` : '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border overflow-hidden" style={{ background:'#161B22' }}>
        {loading ? (
          <div className="text-center py-16 text-muted text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16"><p className="text-muted text-sm">No income entries for {filterYear}</p><button onClick={openAdd} className="mt-3 text-accent text-sm hover:underline">Add your first entry</button></div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {rows.map(row => (
                <div key={row.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background:'rgba(63,185,80,0.1)', color:'#3FB950' }}>{row.source}</span>
                    <p className="text-muted text-xs mt-1">{MONTHS[row.month-1]} {row.year}{row.notes ? ` · ${row.notes}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400 text-sm">{fmt(row.amount)}</span>
                    <button onClick={() => openEdit(row)} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-muted">Edit</button>
                    <button onClick={() => handleDelete(row.id)} className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400">Del</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table>
                <thead><tr><th>Month</th><th>Source</th><th>Notes</th><th className="text-right">Amount</th><th></th></tr></thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id}>
                      <td className="font-mono text-muted text-xs">{MONTHS[row.month-1]} {row.year}</td>
                      <td><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background:'rgba(63,185,80,0.1)', color:'#3FB950' }}>{row.source}</span></td>
                      <td className="text-muted text-xs">{row.notes || '—'}</td>
                      <td className="text-right font-mono font-medium text-emerald-400">{fmt(row.amount)}</td>
                      <td><div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(row)} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-muted hover:text-white transition-colors">Edit</button>
                        <button onClick={() => handleDelete(row.id)} className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Income' : 'Add Income'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-400 px-3 py-2 rounded-lg border border-red-500/20" style={{ background:'rgba(248,81,73,0.08)' }}>{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Year</label><select value={form.year} onChange={e => f('year', Number(e.target.value))}>{[2024,2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Month</label><select value={form.month} onChange={e => f('month', Number(e.target.value))}>{MONTHS.map((m,i) => <option key={m} value={i+1}>{m}</option>)}</select></div>
            </div>
            <div><label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Source</label><select value={form.source} onChange={e => f('source', e.target.value)}>{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Amount (¥) *</label><input type="number" min="0" value={form.amount} onChange={e => f('amount', e.target.value)} placeholder="0" /></div>
            <div><label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Notes</label><input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Optional…" /></div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} disabled={busy} className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm" style={{ background:busy?'#8B949E':'#F0B429', color:'#0D1117', cursor:busy?'not-allowed':'pointer' }}>{busy?'Saving…':editing?'Save Changes':'Add Income'}</button>
              <button onClick={() => setModal(false)} className="px-5 py-2.5 rounded-xl text-sm text-muted hover:text-white border border-border transition-colors">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
