'use client'
import { useState, useRef, useEffect } from 'react'
import { LogOut, HelpCircle, ChevronDown } from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  const inicial = (email.trim()[0] || '?').toUpperCase()
  const logout = async () => { await createSupabaseBrowser().auth.signOut(); window.location.href = '/admin/login' }
  const reverTour = () => { setOpen(false); window.dispatchEvent(new CustomEvent('admin:tour')) }
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 admin-muted hover:admin-text transition-colors" style={{ border: '1px solid var(--admin-border)' }}>
        <span className="w-6 h-6 rounded-full admin-accent flex items-center justify-center text-[11px] font-bold">{inicial}</span>
        <span className="text-[13px] max-w-[160px] truncate hidden sm:block">{email}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl admin-card shadow-xl p-1 z-50">
          <p className="px-3 py-2 text-[12px] admin-muted truncate">{email}</p>
          <div className="h-px my-1" style={{ background: 'var(--admin-border)' }} />
          <button onClick={reverTour} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] admin-text hover:opacity-80" style={{ background: 'transparent' }}>
            <HelpCircle size={15} /> Rever tour
          </button>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] admin-text hover:opacity-80">
            <LogOut size={15} /> Sair
          </button>
        </div>
      )}
    </div>
  )
}
