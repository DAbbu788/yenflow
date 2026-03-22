import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(n) {
  if (!n) return ''
  if (n >= 1000) return `${(n/1000).toFixed(0)}K`
  return String(n)
}

export default function BudgetGrid() {
  const { user }             = useAuth()
  const { categories }       = useCategories()
  const [year,   setYear]    = useState(new Date().getFullYear())
  const [grid,   setGrid]    = useState({})   // { 'CategoryName:monthNum': amount }
  const [saving, setSaving]  = useState({})   // { 'key': true } while debouncing
  const [loading,setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user || !categories.length) return
    setLoading(true)
    const { data } = await supabase
      .from('monthly_budget_grid')
      .select('category_name, month, amount')
      .eq('user_id', user.id)
      .eq('year', year)

    // If no data for this year yet, seed from budget_defaults
    let gridMap = {}
    if (!data || data.length === 0) {
      const { data: defaults } = await supabase
        .from('budget_defaults')
        .select('category_name, monthly_amount')
        .eq('user_id', user.id)

      // Insert defaults for all categories x 12 months
      if (defaults?.length) {
        const rows = []
        defaults.forEach(d => {
          MONTHS.forEach((_, i) => {
            const key = `${d.category_name}:${i+1}`
            gridMap[key] = d.monthly_amount || 0
            rows.push({
              user_id:       user.id,
              category_name: d.category_name,
              year,
              month:         i+1,
              amount:        d.monthly_amount || 0,
            })
          })
        })
        // Upsert silently
        await supabase.from('monthly_budget_grid')
          .upsert(rows, { onConflict: 'user_id,category_name,year,month', ignoreDuplicates: false })
      }
    } else {
      ;(data || []).forEach(r => {
        gridMap[`${r.category_name}:${r.month}`] = Number(r.amount)
      })
    }
    setGrid(gridMap)
    setLoading(false)
  }, [user, year, categories])

  useEffect(() => { load() }, [load])

  // Debounced cell save
  async function handleCell(cat, month, raw) {
    const val = raw === '' ? 0 : Math.max(0, Number(raw))
    const key = `${cat}:${month}`
    setGrid(g => ({ ...g, [key]: raw === '' ? '' : val }))
    setSaving(s => ({ ...s, [key]: true }))

    clearTimeout(window[`__yf_${key}`])
    window[`__yf_${key}`] = setTimeout(async () => {
      await supabase.from('monthly_budget_grid').upsert({
        user_id:       user.id,
        category_name: cat,
        year,
        month,
        amount: val,
      }, { onConflict: 'user_id,category_name,year,month' })
      setSaving(s => { const n={...s}; delete n[key]; return n })
    }, 600)
  }

  function rowTotal(cat) {
    return MONTHS.reduce((s,_,i) => s + (Number(grid[`${cat}:${i+1}`]) || 0), 0)
  }
  function colTotal(month) {
    return categories.reduce((s,c) => s + (Number(grid[`${c.name}:${month}`]) || 0), 0)
  }
  const grandTotal = categories.reduce((s,c) => s + rowTotal(c.name), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Budget Grid</h1>
          <p className="text-muted text-sm mt-0.5">Plan each category month by month · click any cell to edit</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
            Saving…
          </div>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm w-24">
            {[2024,2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden" style={{ background:'#161B22' }}>
        {loading ? (
          <div className="text-center py-16 text-muted text-sm">Loading grid…</div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ tableLayout: 'fixed', minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '160px', textAlign:'left' }}>Category</th>
                  {MONTHS.map(m => (
                    <th key={m} style={{ width: '72px', textAlign:'center' }}>{m}</th>
                  ))}
                  <th style={{ width: '90px', textAlign:'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: cat.color || '#F0B429' }} />
                        <span className="text-xs text-white/80 truncate">{cat.name}</span>
                      </div>
                    </td>
                    {MONTHS.map((_,i) => {
                      const key = `${cat.name}:${i+1}`
                      const val = grid[key]
                      const isSaving = saving[key]
                      return (
                        <td key={i} style={{ padding: '4px 3px' }}>
                          <input
                            type="number"
                            min="0"
                            value={val === '' ? '' : (val || '')}
                            onChange={e => handleCell(cat.name, i+1, e.target.value)}
                            placeholder="0"
                            style={{
                              width: '100%',
                              padding: '5px 6px',
                              fontSize: 11,
                              textAlign: 'center',
                              borderRadius: 6,
                              border: `1px solid ${isSaving ? '#F0B429' : '#21262D'}`,
                              background: val > 0 ? 'rgba(240,180,41,0.05)' : '#0D1117',
                              color: val > 0 ? '#F0B429' : '#8B949E',
                              transition: 'all 0.15s',
                            }}
                          />
                        </td>
                      )
                    })}
                    <td className="text-right">
                      <span className="font-mono text-xs font-medium text-white/70">
                        ¥{rowTotal(cat.name).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Monthly totals */}
                <tr style={{ borderTop: '2px solid #21262D' }}>
                  <td className="font-bold text-xs text-muted">Monthly Total</td>
                  {MONTHS.map((_,i) => (
                    <td key={i} style={{ textAlign:'center', padding:'8px 3px' }}>
                      <span className="font-mono text-xs text-muted">
                        {colTotal(i+1) > 0 ? `${(colTotal(i+1)/1000).toFixed(0)}K` : '—'}
                      </span>
                    </td>
                  ))}
                  <td className="text-right">
                    <span className="font-mono text-xs font-bold text-accent">
                      ¥{grandTotal.toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        💡 Changes save automatically as you type. Leave a cell blank or set to 0 for months you don't plan to spend in that category.
      </p>
    </div>
  )
}
