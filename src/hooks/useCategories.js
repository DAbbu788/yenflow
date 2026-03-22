import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order')
    setCategories(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function addCategory(name, color = '#F0B429') {
    if (!name.trim()) return
    const maxOrder = categories.length ? Math.max(...categories.map(c => c.sort_order)) : 0
    const { error } = await supabase.from('categories').insert({
      user_id: user.id,
      name: name.trim(),
      color,
      sort_order: maxOrder + 1,
    })
    if (error) throw error
    // Also add to budget_defaults with 0
    await supabase.from('budget_defaults').upsert({
      user_id: user.id,
      category_name: name.trim(),
      monthly_amount: 0,
    }, { onConflict: 'user_id,category_name' })
    await load()
  }

  async function removeCategory(name) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', user.id)
      .eq('name', name)
    if (error) throw error
    // Also remove from budget_defaults and grid
    await supabase.from('budget_defaults').delete().eq('user_id', user.id).eq('category_name', name)
    await supabase.from('monthly_budget_grid').delete().eq('user_id', user.id).eq('category_name', name)
    await load()
  }

  async function renameCategory(oldName, newName) {
    if (!newName.trim() || oldName === newName.trim()) return
    // Supabase doesn't support cascading text updates, so we do them manually
    await supabase.from('categories').update({ name: newName.trim() })
      .eq('user_id', user.id).eq('name', oldName)
    await supabase.from('budget_defaults').update({ category_name: newName.trim() })
      .eq('user_id', user.id).eq('category_name', oldName)
    await supabase.from('monthly_budget_grid').update({ category_name: newName.trim() })
      .eq('user_id', user.id).eq('category_name', oldName)
    // Note: expenses keep old name — we update those too
    await supabase.from('expenses').update({ category_name: newName.trim() })
      .eq('user_id', user.id).eq('category_name', oldName)
    await load()
  }

  return { categories, loading, addCategory, removeCategory, renameCategory, reload: load }
}
