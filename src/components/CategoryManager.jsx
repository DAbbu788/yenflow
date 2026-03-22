import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'

export default function CategoryManager() {
  const { categories, loading, addCategory, removeCategory, renameCategory } = useCategories()
  const [newName,   setNewName]   = useState('')
  const [newColor,  setNewColor]  = useState('#F0B429')
  const [editing,   setEditing]   = useState(null)   // { name, value }
  const [adding,    setAdding]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleAdd() {
    if (!newName.trim()) return
    try {
      setError('')
      await addCategory(newName, newColor)
      setNewName(''); setNewColor('#F0B429'); setAdding(false)
    } catch (e) {
      setError(e.message?.includes('unique') ? 'Category already exists.' : e.message)
    }
  }

  async function handleRemove(name) {
    if (!confirm(`Delete category "${name}"? This won't delete existing expenses, but they'll lose their category tag.`)) return
    await removeCategory(name)
  }

  async function handleRename() {
    if (!editing?.value.trim()) return
    try {
      await renameCategory(editing.name, editing.value)
      setEditing(null)
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading categories…</p>

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Category list */}
      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 group transition-colors"
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />

            {editing?.name === cat.name ? (
              <input
                value={editing.value}
                onChange={e => setEditing({ ...editing, value: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(null) }}
                className="flex-1 text-sm py-1 px-2"
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm text-white/90">{cat.name}</span>
            )}

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {editing?.name === cat.name ? (
                <>
                  <button onClick={handleRename}
                    className="text-xs px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors">
                    Save
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="text-xs px-2 py-1 rounded bg-border text-muted hover:text-white transition-colors">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing({ name: cat.name, value: cat.name })}
                    className="text-xs px-2 py-1 rounded bg-border text-muted hover:text-white transition-colors">
                    Rename
                  </button>
                  <button onClick={() => handleRemove(cat.name)}
                    className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add new */}
      {adding ? (
        <div className="border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-white">New Category</p>
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Category name"
              className="flex-1 text-sm"
              autoFocus
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <label className="text-xs text-muted">Color</label>
              <input
                type="color"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                className="w-10 h-9 p-1 cursor-pointer rounded-lg border border-border bg-ink"
                style={{ width: '40px', padding: '2px' }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex-1 py-2 rounded-lg bg-accent text-ink font-semibold text-sm hover:bg-accent/90 transition-colors">
              Add Category
            </button>
            <button onClick={() => { setAdding(false); setNewName(''); setError('') }}
              className="px-4 py-2 rounded-lg bg-border text-muted hover:text-white text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted hover:border-accent hover:text-accent text-sm transition-all flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Add Category
        </button>
      )}
    </div>
  )
}
