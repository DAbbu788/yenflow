import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS  = ['#F0B429','#3FB950','#58A6FF','#BC8CFF','#F85149','#79C0FF','#D2A8FF','#FFA657','#56D364','#FF7B72','#A5D6FF','#FFD700']

function fmt(n) {
  if (n === undefined || n === null) return '¥0'
  if (Math.abs(n) >= 1_000_000) return `¥${(n/1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000)     return `¥${(n/1_000).toFixed(0)}K`
  return `¥${Number(n).toLocaleString()}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border px-3 py-2 text-xs" style={{ background: '#161B22' }}>
      <p className="font-mono text-muted mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [year,       setYear]       = useState(new Date().getFullYear())
  const [loading,    setLoading]    = useState(true)
  const [monthly,    setMonthly]    = useState([])
  const [byCategory, setByCategory] = useState([])
  const [totals,     setTotals]     = useState({ income:0, spend:0, budget:0 })

  useEffect(() => { load() }, [year, user])

  async function load() {
    if (!user) return
    setLoading(true)
    const start = `${year}-01-01`
    const end   = `${year}-12-31`

    const { data: expRows } = await supabase.from('expenses').select('date, amount, category_name').eq('user_id', user.id).gte('date', start).lte('date', end)
    const { data: incRows } = await supabase.from('income').select('year, month, amount').eq('user_id', user.id).eq('year', year)
    const { data: gridRows } = await supabase.from('monthly_budget_grid').select('amount').eq('user_id', user.id).eq('year', year)

    const incMap = {}
    ;(incRows || []).forEach(r => { incMap[r.month] = (incMap[r.month] || 0) + Number(r.amount) })

    const spendMap = {}
    ;(expRows || []).forEach(r => {
      const m = new Date(r.date).getMonth() + 1
      spendMap[m] = (spendMap[m] || 0) + Number(r.amount)
    })

    const monthlyData = MONTHS.map((label, i) => ({
      month: label,
      Income: incMap[i+1]   || 0,
      Spend:  spendMap[i+1] || 0,
    }))

    const catMap = {}
    ;(expRows || []).forEach(r => { catMap[r.category_name] = (catMap[r.category_name] || 0) + Number(r.amount) })
    const catData = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name, value]) => ({ name, value }))

    const totalSpend  = (expRows  || []).reduce((s,r) => s + Number(r.amount), 0)
    const totalIncome = (incRows  || []).reduce((s,r) => s + Number(r.amount), 0)
    const totalBudget = (gridRows || []).reduce((s,r) => s + Number(r.amount), 0)

    setMonthly(monthlyData)
    setByCategory(catData)
    setTotals({ income: totalIncome, spend: totalSpend, budget: totalBudget })
    setLoading(false)
  }

  const savings = totals.income - totals.spend
  const utilPct = totals.budget > 0 ? ((totals.spend / totals.budget) * 100).toFixed(1) : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">Annual overview</p>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-24 text-sm">
          {[2024,2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted text-sm">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
            <StatCard label="Total Income"  value={fmt(totals.income)}  color="#3FB950" />
            <StatCard label="Total Spend"   value={fmt(totals.spend)}   color="#F85149" />
            <StatCard label="Net Savings"   value={fmt(savings)}        color={savings >= 0 ? '#3FB950' : '#F85149'} accent={savings >= 0} />
            <StatCard label="Budget Used"   value={utilPct === '—' ? '—' : `${utilPct}%`}
              sub={totals.budget > 0 ? `of ${fmt(totals.budget)}` : 'No budget set'}
              color={Number(utilPct) > 100 ? '#F85149' : '#F0B429'} />
          </div>

          <div className="rounded-2xl border border-border p-4 md:p-6" style={{ background: '#161B22' }}>
            <h2 className="font-display font-semibold text-white mb-4 text-sm md:text-base">Monthly Income vs Spend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly} barGap={2} barCategoryGap="25%">
                <XAxis dataKey="month" tick={{ fill:'#8B949E', fontSize:10, fontFamily:'DM Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#8B949E', fontSize:9, fontFamily:'DM Mono' }} tickFormatter={v => v >= 1000 ? `${v/1000}K` : v} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="Income" fill="#3FB950" radius={[3,3,0,0]} />
                <Bar dataKey="Spend"  fill="#F85149" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-4 md:p-6" style={{ background: '#161B22' }}>
              <h2 className="font-display font-semibold text-white mb-4 text-sm md:text-base">Spend by Category</h2>
              {byCategory.length === 0 ? (
                <p className="text-muted text-sm text-center py-8">No expenses yet for {year}</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'#161B22', border:'1px solid #21262D', borderRadius:10, fontSize:11 }} />
                    <Legend formatter={v => <span style={{ color:'#8B949E', fontSize:10 }}>{v}</span>} iconType="circle" iconSize={7} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl border border-border p-4 md:p-6" style={{ background: '#161B22' }}>
              <h2 className="font-display font-semibold text-white mb-4 text-sm md:text-base">Top Categories</h2>
              {byCategory.length === 0 ? (
                <p className="text-muted text-sm text-center py-8">No expenses yet for {year}</p>
              ) : (
                <div className="space-y-3">
                  {byCategory.slice(0,7).map((cat, i) => {
                    const pct = totals.spend > 0 ? (cat.value / totals.spend * 100) : 0
                    return (
                      <div key={cat.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/80 truncate mr-2">{cat.name}</span>
                          <span className="font-mono text-muted flex-shrink-0">{fmt(cat.value)}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: '#21262D' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
