import { useEffect } from 'react'

export default function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 anim-fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full ${width} md:rounded-2xl rounded-t-2xl border border-border shadow-2xl anim-fade-up`}
        style={{ background: '#161B22', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Handle bar on mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#21262D' }} />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-bold text-base text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-white hover:bg-border transition-all">✕</button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
