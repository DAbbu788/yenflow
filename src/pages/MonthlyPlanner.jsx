import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import StatCard from '../components/StatCard'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmt(n)   { return `¥${Number(n||0).toLocaleString()}` }
function pct(a,b) { return b > 0 ? ((a/b)*100).toFixed(1) : null }

function StatusBadge({ actual, budget }) {
  if (budget === 0 && actual === 0) return <span className="text-xs text-muted">⚪</span>
  if (budget === 0 && actual > 0)   return <span className="text-xs" style={{ color:'#F85149' }}>🔴</span>
  const p = actual / budget
  if (p > 1)   return <span className="text-xs" style={{ color:'#F85149' }}>🔴 Over</span>
  if (p > 0.8) return <span className="text-xs" style={{ color:'#F0B429' }}>🟡 Near</span>
  if (actual === 0) return <span className="text-xs text-muted">⚪</span>
  return <span className="text-xs" style={{ color:'#3FB950' }}>✅</span>
}

export default function MonthlyPlanner() {
  const { user }       = useAuth()
  const { categories } = useCategories()
  const now = new Date()
  const [year,     setYear]     = useState(now.getFullYear())
  const [monthIdx, setMonthIdx] = useState(now.getMonth())
  const [data,     setData]     = useState([])
  const [income,   setIncome]   = useState(0)
  const [loading,  setLoading]  = useState(true)
  const month = monthIdx + 1

  const load = useCallback(async () => {
    if (!user || !categories.length) return
    setLoading(true)
    const monthStr = String(month).padStart(2,'0')
    const { data: gridRows } = await supabase.from('monthly_budget_grid').select('category_name, amount').eq('user_id', user.id).eq('year', year).eq('month', month)
    const { data: expRows  } = await supabase.from('expenses').select('category_name, amount').eq('user_id', user.id).gte('date', `${year}-${monthStr}-01`).lte('date', `${year}-${monthStr}-31`)
    const { data: incRows  } = await supabase.from('income').select('amount').eq('user_id', user.id).eq('year', year).eq('month', month)

    const budgetMap = {}; (gridRows||[]).forEach(r => { budgetMap[r.category_name] = Number(r.amount) })
    const actualMap = {}; (expRows ||[]).forEach(r => { actualMap[r.category_name] = (actualMap[r.category_name]||0) + Number(r.amount) })

    setData(categories.map(c => ({ cat: c.name, color: c.color, budget: budgetMap[c.name]||0, actual: actualMap[c.name]||0 })))
    setIncome((incRows||[]).reduce((s,r) => s+Number(r.amount), 0))
    setLoading(false)
  }, [user, categories, year, month])

  useEffect(() => { load() }, [load])

  const totalBudget = data.reduce((s,r) => s+r.budget, 0)
  const totalActual = data.reduce((s,r) => s+r.actual, 0)
  const savings     = income - totalActual
  const utilPct     = totalBudget > 0 ? ((totalActual/totalBudget)*100).toFixed(1) : null

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-white">Monthly Planner</h1>
          <p className="text-muted text-xs mt-0.5">Budget vs actual · {MONTHS[monthIdx]} {year}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm w-24">
            {[2024,2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* Month picker — scrollable on mobile */}
          <div className="flex rounded-xl border border-border overflow-x-auto max-w-xs md:max-w-none" style={{ background:'#161B22' }}>
            {MONTHS.map((m,i) => (
              <button key={m} onClick={() => setMonthIdx(i)}
                className="flex-shrink-0 px-2.5 py-2 text-xs font-mono transition-all"
                style={monthIdx === i ? { background:'#F0B429', color:'#0D1117', fontWeight:700 } : { color:'#8B949E' }}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted text-sm">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
            <StatCard label="Income"         value={fmt(income)}      color="#3FB950" />
            <StatCard label="Planned"        value={fmt(totalBudget)} color="#58A6FF" />
            <StatCard label="Actual Spend"   value={fmt(totalActual)} color="#F85149" />
            <StatCard label="Net Savings"    value={fmt(savings)}     color={savings >= 0 ? '#3FB950' : '#F85149'} sub={utilPct ? `${utilPct}% of budget used` : undefined} />
          </div>

          {/* Mobile: stacked cards per category */}
          <div className="md:hidden space-y-2">
            {data.map(row => {
              const barPct   = row.budget > 0 ? Math.min(100, (row.actual/row.budget)*100) : 0
              const barColor = row.actual > row.budget ? '#F85149' : row.actual/row.budget > 0.8 ? '#F0B429' : '#3FB950'
              return (
                <div key={row.cat} className="rounded-xl border border-border p-3" style={{ background:'#161B22' }}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color || '#F0B429' }} />
                      <span className="text-sm text-white/90">{row.cat}</span>
                    </div>
                    <StatusBadge actual={row.actual} budget={row.budget} />
                  </div>
                  <div className="flex justify-between text-xs text-muted mb-1.5">
                    <span>Budget: <span className="text-sky-400 font-mono">{row.budget > 0 ? fmt(row.budget) : '—'}</span></span>
                    <span>Spent: <span className="text-red-400 font-mono">{row.actual > 0 ? fmt(row.actual) : '—'}</span></span>
                  </div>
                  {row.budget > 0 && (
                    <div className="h-1.5 rounded-full" style={{ background:'#21262D' }}>
                      <div className="h-full rounded-full transition-all" style={{ width:`${barPct}%`, background: barColor }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-border overflow-hidden" style={{ background:'#161B22' }}>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Category</th><th className="text-right">Budget</th><th className="text-right">Actual</th><th className="text-right">Remaining</th><th className="text-center">Used</th><th className="text-center">Status</th></tr></thead>
                <tbody>
                  {data.map(row => {
                    const remaining = row.budget - row.actual
                    const used      = pct(row.actual, row.budget)
                    const barPct    = row.budget > 0 ? Math.min(100, (row.actual/row.budget)*100) : 0
                    const barColor  = row.actual > row.budget ? '#F85149' : row.actual/row.budget > 0.8 ? '#F0B429' : '#3FB950'
                    return (
                      <tr key={row.cat}>
                        <td>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color||'#F0B429' }} /><span className="text-sm text-white/90">{row.cat}</span></div>
                          {row.budget > 0 && <div className="mt-1.5 h-1 rounded-full w-32" style={{ background:'#21262D' }}><div className="h-full rounded-full" style={{ width:`${barPct}%`, background:barColor }} /></div>}
                        </td>
                        <td className="text-right font-mono text-xs text-muted">{row.budget > 0 ? fmt(row.budget) : '—'}</td>
                        <td className="text-right font-mono text-xs" style={{ color: row.actual > 0 ? '#F85149' : '#21262D' }}>{row.actual > 0 ? fmt(row.actual) : '—'}</td>
                        <td className="text-right font-mono text-xs" style={{ color: remaining < 0 ? '#F85149' : '#8B949E' }}>{row.budget > 0 ? fmt(remaining) : '—'}</td>
                        <td className="text-center font-mono text-xs text-muted">{used ? `${used}%` : '—'}</td>
                        <td className="text-center"><StatusBadge actual={row.actual} budget={row.budget} /></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop:'2px solid #21262D' }}>
                    <td className="font-bold text-xs text-white">Total</td>
                    <td className="text-right font-mono text-xs font-bold text-sky-400">{fmt(totalBudget)}</td>
                    <td className="text-right font-mono text-xs font-bold text-red-400">{fmt(totalActual)}</td>
                    <td className="text-right font-mono text-xs font-bold" style={{ color: totalBudget-totalActual < 0 ? '#F85149':'#8B949E' }}>{fmt(totalBudget-totalActual)}</td>
                    <td className="text-center font-mono text-xs text-muted">{utilPct ? `${utilPct}%` : '—'}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
