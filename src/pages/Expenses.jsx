import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import Modal from '../components/Modal'
import { format } from 'date-fns'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(n) { return `¥${Number(n).toLocaleString()}` }

const EMPTY = { date: format(new Date(),'yyyy-MM-dd'), description:'', category_name:'', amount:'', payment_method:'', notes:'' }

export default function Expenses() {
  const { user }                  = useAuth()
  const { categories }            = useCategories()
  const { methods }               = usePaymentMethods()
  const [rows,    setRows]         = useState([])
  const [loading, setLoading]      = useState(true)
  const [modal,   setModal]        = useState(null)
  const [form,    setForm]         = useState(EMPTY)
  const [editing, setEditing]      = useState(null)
  const [error,   setError]        = useState('')
  const [busy,    setBusy]         = useState(false)

  const [filterYear,  setFilterYear]  = useState(new Date().getFullYear())
  const [filterMonth, setFilterMonth] = useState(0)
  const [filterCat,   setFilterCat]   = useState('')
  const [search,      setSearch]      = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let q = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${filterYear}-01-01`)
      .lte('date', `${filterYear}-12-31`)
      .order('date', { ascending: false })

    if (filterMonth) {
      const m = String(filterMonth).padStart(2,'0')
      q = q.gte('date', `${filterYear}-${m}-01`)
           .lte('date', `${filterYear}-${m}-31`)
    }
    if (filterCat) q = q.eq('category_name', filterCat)

    const { data } = await q
    setRows(data ?? [])
    setLoading(false)
  }, [user, filterYear, filterMonth, filterCat])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r =>
    !search ||
    r.description?.toLowerCase().includes(search.toLowerCase()) ||
    r.category_name?.toLowerCase().includes(search.toLowerCase())
  )

  const total = filtered.reduce((s,r) => s + Number(r.amount), 0)

  function openAdd()     { setForm({ ...EMPTY, date: format(new Date(),'yyyy-MM-dd') }); setEditing(null); setError(''); setModal('form') }
  function openEdit(row) { setForm({ date: row.date, description: row.description||'', category_name: row.category_name, amount: row.amount, payment_method: row.payment_method||'', notes: row.notes||'' }); setEditing(row.id); setError(''); setModal('form') }

  async function handleSave() {
    if (!form.date || !form.category_name || !form.amount) { setError('Date, category, and amount are required.'); return }
    if (Number(form.amount) <= 0) { setError('Amount must be greater than 0.'); return }
    setBusy(true); setError('')
    try {
      const payload = { ...form, amount: Number(form.amount), user_id: user.id }
      if (editing) {
        const { error: e } = await supabase.from('expenses').update(payload).eq('id', editing)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('expenses').insert(payload)
        if (e) throw e
      }
      setModal(null); await load()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return
    await supabase.from('expenses').delete().eq('id', id)
    await load()
  }

  function f(k, v) { setForm(p => ({ ...p, [k]: v })) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Expenses</h1>
          <p className="text-muted text-sm mt-0.5">
            {filtered.length} entries · <span className="text-red-400">{fmt(total)}</span>
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-display font-semibold text-sm transition-all"
          style={{ background:'#F0B429', color:'#0D1117' }}>
          + Add Expense
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="text-sm">
          {[2024,2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="text-sm">
          <option value={0}>All months</option>
          {MONTHS.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="text-sm">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="text-sm" />
      </div>

      <div className="rounded-2xl border border-border overflow-hidden" style={{ background:'#161B22' }}>
        {loading ? (
          <div className="text-center py-16 text-muted text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-sm">No expenses found</p>
            <button onClick={openAdd} className="mt-3 text-accent text-sm hover:underline">Add your first expense</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th className="text-right">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td className="font-mono text-muted text-xs">{row.date}</td>
                    <td className="max-w-xs">
                      <p className="text-white/90 truncate">{row.description || <span className="text-muted italic">—</span>}</p>
                      {row.notes && <p className="text-muted text-xs truncate mt-0.5">{row.notes}</p>}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background:'rgba(240,180,41,0.12)', color:'#F0B429' }}>
                        {row.category_name}
                      </span>
                    </td>
                    <td className="text-muted text-xs">{row.payment_method || '—'}</td>
                    <td className="text-right font-mono font-medium text-red-400">{fmt(row.amount)}</td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(row)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-muted hover:text-white transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(row.id)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'form' && (
        <Modal title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-400 px-3 py-2 rounded-lg border border-red-500/20" style={{ background:'rgba(248,81,73,0.08)' }}>{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Date *</label>
                <input type="date" value={form.date} onChange={e => f('date',e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Amount (¥) *</label>
                <input type="number" min="0" value={form.amount} onChange={e => f('amount',e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Description</label>
              <input value={form.description} onChange={e => f('description',e.target.value)} placeholder="What did you spend on?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Category *</label>
                <select value={form.category_name} onChange={e => f('category_name',e.target.value)}>
                  <option value="">Select…</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Payment</label>
                <select value={form.payment_method} onChange={e => f('payment_method',e.target.value)}>
                  <option value="">Select…</option>
                  {methods.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Notes</label>
              <textarea value={form.notes} onChange={e => f('notes',e.target.value)} placeholder="Optional notes…" rows={2} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} disabled={busy}
                className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all"
                style={{ background: busy ? '#8B949E':'#F0B429', color:'#0D1117', cursor: busy?'not-allowed':'pointer' }}>
                {busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Expense'}
              </button>
              <button onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl text-sm text-muted hover:text-white border border-border transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
