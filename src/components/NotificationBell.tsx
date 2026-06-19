'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Notificacion {
  id: number
  tipo: string
  titulo: string
  mensaje: string
  espacio_id: number | null
  reserva_id: number | null
  mensaje_id: number | null
  leida: boolean
  created_at: string
}

const TIPO_ICON: Record<string, string> = {
  nueva_reserva: '📋',
  nuevo_mensaje: '💬',
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    if (!session?.user) return
    fetch('/api/notificaciones?limit=10')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.notificaciones)) setNotificaciones(d.notificaciones)
        if (typeof d.noLeidas === 'number') setNoLeidas(d.noLeidas)
      })
      .catch(() => {})
  }, [session])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    window.addEventListener('focus', load)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', load)
    }
  }, [load])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (!session?.user) return null

  const handleClick = async (n: Notificacion) => {
    if (!n.leida) {
      setNotificaciones(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x))
      setNoLeidas(prev => Math.max(0, prev - 1))
      fetch(`/api/notificaciones/${n.id}`, { method: 'PATCH' }).catch(() => {})
    }
    setOpen(false)
    if (n.tipo === 'nueva_reserva' && n.espacio_id) {
      router.push(`/dashboard/espacio/${n.espacio_id}`)
    } else if (n.tipo === 'nuevo_mensaje') {
      router.push('/mensajes')
    }
  }

  const marcarTodas = async () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    setNoLeidas(0)
    fetch('/api/notificaciones/marcar-todas', { method: 'PATCH' }).catch(() => {})
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
        aria-label="Notificaciones"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-[340px] bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-sm font-bold text-white">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodas}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notificaciones.length === 0 ? (
              <p className="text-center text-sm text-white/30 py-10">No tienes notificaciones</p>
            ) : (
              notificaciones.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors flex gap-3 ${
                    n.leida ? 'hover:bg-white/3' : 'bg-amber-400/5 hover:bg-amber-400/8'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{TIPO_ICON[n.tipo] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${n.leida ? 'text-white/70' : 'text-white'}`}>{n.titulo}</p>
                      {!n.leida && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-white/40 line-clamp-2 mt-0.5">{n.mensaje}</p>
                    <p className="text-xs text-white/25 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
