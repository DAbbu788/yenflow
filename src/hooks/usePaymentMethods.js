import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function usePaymentMethods() {
  const { user } = useAuth()
  const [methods,  setMethods]  = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order')
    setMethods(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function addMethod(name) {
    if (!name.trim()) return
    const maxOrder = methods.length ? Math.max(...methods.map(m => m.sort_order)) : 0
    const { error } = await supabase.from('payment_methods').insert({
      user_id:    user.id,
      name:       name.trim(),
      sort_order: maxOrder + 1,
    })
    if (error) throw error
    await load()
  }

  async function removeMethod(name) {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('user_id', user.id)
      .eq('name', name)
    if (error) throw error
    await load()
  }

  async function renameMethod(oldName, newName) {
    if (!newName.trim() || oldName === newName.trim()) return
    await supabase.from('payment_methods')
      .update({ name: newName.trim() })
      .eq('user_id', user.id)
      .eq('name', oldName)
    // Also update existing expenses that used this payment method
    await supabase.from('expenses')
      .update({ payment_method: newName.trim() })
      .eq('user_id', user.id)
      .eq('payment_method', oldName)
    await load()
  }

  return { methods, loading, addMethod, removeMethod, renameMethod, reload: load }
}
