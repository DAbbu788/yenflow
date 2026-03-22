import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'

const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SERVICES = ['Wise','SBI Remit','Revolut','Western Union','PayPay','Bank Wire','Other']

function fmtJPY(n) { return `¥${Number(n||0).toLocaleString()}` }
function fmtINR(n) { return `₹${Number(n||0).toLocaleString()}` }

const EMPTY = {
  date: new Date().toISOString().slice(0,10),
  year: new Date().getFullYear(),
  month: new Date().getMonth()+1,
  amount_jpy: '',
  exchange_rate: '',
  transfer_service: 'Wise',
  notes: '',
}

export default function Remittance() {
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
    const { data } = await supabase
      .from('remittance')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', filterYear)
      .order('date', { ascending: false })
    setRows(data ?? [])
    setLoading(false)
  }, [user, filterYear])

  useEffect(() => { load() }, [load])

  const totalJPY = rows.reduce((s,r) => s + Number(r.amount_jpy), 0)
  const totalINR = rows.reduce((s,r) => s + Number(r.amount_inr), 0)
  const avgRate  = rows.length > 0
    ? (rows.reduce((s,r) => s + Number(r.exchange_rate), 0) / rows.length).toFixed(3)
    : '—'

  function openAdd()   { setForm({ ...EMPTY, year: filterYear }); setEditing(null); setError(''); setModal(true) }
  function openEdit(r) {
    setForm({ date:r.date, year:r.year, month:r.month, amount_jpy:r.amount_jpy, exchange_rate:r.exchange_rate, transfer_service:r.transfer_service||'Wise', notes:r.notes||'' })
    setEditing(r.id); setError(''); setModal(true)
  }

  async function handleSave() {
    if (!form.date || !form.amount_jpy || !form.exchange_rate) { setError('Date, amount, and exchange rate are required.'); return }
    if (Number(form.amount_jpy) <= 0)    { setError('Amount must be > 0.'); return }
    if (Number(form.exchange_rate) <= 0) { setError('Exchange rate must be > 0.'); return }
    setBusy(true); setError('')
    try {
      const payload = {
        ...form,
        amount_jpy:    Number(form.amount_jpy),
        exchange_rate: Number(form.exchange_rate),
        user_id: user.id,
      }
      if (editing) {
        const { error:e } = await supabase.from('remittance').update(payload).eq('id', editing)
        if (e) throw e
      } else {
        const { error:e } = await supabase.from('remittance').insert(payload)
        if (e) throw e
      }
      setModal(false); await load()
    } catch(e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this remittance entry?')) return
    await supabase.from('remittance').delete().eq('id', id)
    await load()
  }

  function f(k,v) { setForm(p => ({ ...p, [k]:v })) }

  // Preview INR while filling form
  const previewINR = form.amount_jpy && form.exchange_rate
    ? (Number(form.amount_jpy) * Number(form.exchange_rate)).toLocaleString()
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Remittance 🇮🇳</h1>
          <p className="text-muted text-sm mt-0.5">Money sent home · ¥ → ₹</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="text-sm w-24">
            {[2024,2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openAdd}
            className="px-4 py-2 rounded-xl font-display font-semibold text-sm"
            style={{ background:'#F0B429', color:'#0D1117' }}>
            + Add Transfer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
        <StatCard label="Total Sent (¥)"      value={fmtJPY(totalJPY)} color="#F0B429" />
        <StatCard label="Total Received (₹)"  value={fmtINR(totalINR)} color="#BC8CFF" />
        <StatCard label="Avg Exchange Rate"   value={avgRate} sub="¥1 = ₹ x rate" color="#58A6FF" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden" style={{ background:'#161B22' }}>
        {loading ? (
          <div className="text-center py-16 text-muted text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-sm">No remittance entries for {filterYear}</p>
            <button onClick={openAdd} className="mt-3 text-accent text-sm hover:underline">Log your first transfer</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Month</th>
                <th>Sent (¥)</th>
                <th>Rate</th>
                <th>Received (₹)</th>
                <th>Service</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="font-mono text-muted text-xs">{row.date}</td>
                  <td className="text-muted text-xs">{MONTHS[row.month-1]}</td>
                  <td className="font-mono text-accent">{fmtJPY(row.amount_jpy)}</td>
                  <td className="font-mono text-muted text-xs">{Number(row.exchange_rate).toFixed(3)}</td>
                  <td className="font-mono text-violet-400">{fmtINR(row.amount_inr)}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background:'rgba(188,140,255,0.1)', color:'#BC8CFF' }}>
                      {row.transfer_service || '—'}
                    </span>
                  </td>
                  <td className="text-muted text-xs">{row.notes || '—'}</td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(row)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-muted hover:text-white transition-colors">Edit</button>
                      <button onClick={() => handleDelete(row.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Transfer' : 'Log Remittance'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-400 px-3 py-2 rounded-lg border border-red-500/20" style={{ background:'rgba(248,81,73,0.08)' }}>{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Date *</label>
                <input type="date" value={form.date} onChange={e => { const d=e.target.value; f('date',d); f('year',new Date(d).getFullYear()); f('month',new Date(d).getMonth()+1) }} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Service</label>
                <select value={form.transfer_service} onChange={e => f('transfer_service',e.target.value)}>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Amount Sent (¥) *</label>
                <input type="number" min="0" value={form.amount_jpy} onChange={e => f('amount_jpy',e.target.value)} placeholder="30000" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Exchange Rate (¥→₹) *</label>
                <input type="number" min="0" step="0.001" value={form.exchange_rate} onChange={e => f('exchange_rate',e.target.value)} placeholder="0.560" />
              </div>
            </div>
            {previewINR && (
              <div className="px-4 py-3 rounded-xl border border-violet-500/20 text-sm"
                style={{ background:'rgba(188,140,255,0.06)' }}>
                <span className="text-muted">Family receives: </span>
                <span className="font-mono font-bold text-violet-400">₹{previewINR}</span>
              </div>
            )}
            <div>
              <label className="block text-xs text-muted mb-1.5 font-mono uppercase tracking-wider">Notes</label>
              <input value={form.notes} onChange={e => f('notes',e.target.value)} placeholder="Monthly transfer, festival extra…" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} disabled={busy}
                className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm"
                style={{ background: busy ? '#8B949E':'#F0B429', color:'#0D1117', cursor:busy?'not-allowed':'pointer' }}>
                {busy ? 'Saving…' : editing ? 'Save Changes' : 'Log Transfer'}
              </button>
              <button onClick={() => setModal(false)}
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
