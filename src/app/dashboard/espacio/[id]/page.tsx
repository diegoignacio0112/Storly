'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// ─── types ────────────────────────────────────────────────────────────────────

interface Espacio {
  id: number
  titulo: string
  tipo: string
  precio_mensual: number
  metros_cuadrados: number | null
  comuna: string
  direccion: string | null
  descripcion: string | null
  disponible: boolean
  imagenes: string[] | null
  imagen_url: string | null
  usuario_id: number
}

interface Stats {
  totalVistas: number
  vistasSemanaActual: number
  vistasPorDia: { fecha: string; count: number }[]
  reservas: { pendientes: number; aprobadas: number; rechazadas: number; total: number }
  mensajesNoLeidos: number
  mensajesTotal: number
}

interface Solicitud {
  id: number
  usuario_id: number
  usuario_nombre: string
  usuario_email: string
  fecha_inicio: string
  fecha_fin: string
  precio_total: number
  meses: number
  estado: string
  created_at: string
}

interface Hilo {
  id: number
  de_usuario_id: number
  para_usuario_id: number
  de_nombre: string
  para_nombre: string
  mensaje: string
  created_at: string
  no_leidos: number
}

interface ChatMsg {
  id: number
  de_usuario_id: number
  de_nombre: string
  mensaje: string
  created_at: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const TIPO_ICON: Record<string, string> = {
  bodega: '📦', garage: '🚗', patio: '🌿',
  pieza: '🏠', estacionamiento: '🅿️', otro: '📁',
}
const TIPO_LABEL: Record<string, string> = {
  bodega: 'Bodega', garage: 'Garage', patio: 'Patio',
  pieza: 'Pieza', estacionamiento: 'Estacionamiento', otro: 'Otro',
}
const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'bg-amber-400/10 text-amber-400',
  aprobada: 'bg-green-400/10 text-green-400',
  rechazada: 'bg-red-400/10 text-red-400',
}

const fmt = (n: number) => '$' + n.toLocaleString('es-CL')
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
const formatDay = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { weekday: 'short' }).slice(0, 1).toUpperCase()

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ─── conversation panel ───────────────────────────────────────────────────────

function ConversationPanel({
  espacioId, hilo, meId,
}: {
  espacioId: number
  hilo: Hilo
  meId: number
}) {
  const [mensajes, setMensajes] = useState<ChatMsg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const otherId = hilo.de_usuario_id === meId ? hilo.para_usuario_id : hilo.de_usuario_id
  const otherName = hilo.de_usuario_id === meId ? hilo.para_nombre : hilo.de_nombre

  const load = () => {
    fetch(`/api/mensajes?espacio_id=${espacioId}&otro_usuario_id=${otherId}`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setMensajes(d))
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    await fetch('/api/mensajes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ para_usuario_id: otherId, espacio_id: espacioId, mensaje: text.trim() }),
    })
    setText('')
    setSending(false)
    load()
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl flex flex-col h-[420px] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#2D4A3E] flex items-center justify-center text-sm font-bold flex-shrink-0">
          {otherName?.[0]?.toUpperCase()}
        </div>
        <p className="text-sm font-bold text-white">{otherName}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {mensajes.map(m => {
          const isMe = m.de_usuario_id === meId
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-amber-400 text-black' : 'bg-white/8 text-white'}`}>
                {m.mensaje}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-white/8 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Responder..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="bg-amber-400 text-black rounded-xl px-3 font-bold text-sm hover:bg-amber-300 transition-all disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  )
}

// ─── edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  espacio, onClose, onSaved,
}: {
  espacio: Espacio
  onClose: () => void
  onSaved: (updated: Espacio) => void
}) {
  const [form, setForm] = useState({
    titulo: espacio.titulo,
    precio_mensual: espacio.precio_mensual,
    metros_cuadrados: espacio.metros_cuadrados ?? 0,
    comuna: espacio.comuna,
    direccion: espacio.direccion ?? '',
    descripcion: espacio.descripcion ?? '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/espacios/${espacio.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) onSaved(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0d14] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-xl">✕</button>
        <h2 className="text-xl font-black mb-5">Editar espacio</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Título</label>
            <input
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Precio mensual</label>
              <input
                type="number"
                value={form.precio_mensual}
                onChange={e => setForm({ ...form, precio_mensual: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Metros²</label>
              <input
                type="number"
                value={form.metros_cuadrados}
                onChange={e => setForm({ ...form, metros_cuadrados: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Comuna</label>
            <input
              value={form.comuna}
              onChange={e => setForm({ ...form, comuna: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Dirección</label>
            <input
              value={form.direccion}
              onChange={e => setForm({ ...form, direccion: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 resize-none"
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full mt-5 bg-amber-400 text-black font-bold py-3 rounded-xl hover:bg-amber-300 transition-all disabled:opacity-40"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function EspacioAnalyticsPage() {
  const { id } = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const espacioId = Array.isArray(id) ? id[0] : id

  const [espacio, setEspacio] = useState<Espacio | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [hilos, setHilos] = useState<Hilo[]>([])
  const [activeHilo, setActiveHilo] = useState<Hilo | null>(null)
  const [tab, setTab] = useState<'solicitudes' | 'mensajes' | 'vistas'>('solicitudes')
  const [showEdit, setShowEdit] = useState(false)
  const [forbidden, setForbidden] = useState(false)

  const meId = session?.user?.id ? Number(session.user.id) : null

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (!espacioId) return
    fetch(`/api/espacios/${espacioId}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setEspacio(data) })
  }, [espacioId])

  useEffect(() => {
    if (!espacio || meId === null) return
    if (espacio.usuario_id !== meId) { setForbidden(true); return }
    fetch(`/api/espacios/${espacioId}/stats`)
      .then(r => r.json())
      .then(d => !d.error && setStats(d))
    fetch(`/api/reservas?espacio_id=${espacioId}`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setSolicitudes(d))
    fetch(`/api/mensajes?espacio_id=${espacioId}`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setHilos(d))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espacio, meId])

  const responder = async (reservaId: number, estado: 'aprobada' | 'rechazada') => {
    const res = await fetch(`/api/reservas/${reservaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      setSolicitudes(prev => prev.map(s => s.id === reservaId ? { ...s, estado } : s))
      setStats(prev => {
        if (!prev) return prev
        const r = { ...prev.reservas }
        r.pendientes = Math.max(0, r.pendientes - 1)
        if (estado === 'aprobada') r.aprobadas += 1
        else r.rechazadas += 1
        return { ...prev, reservas: r }
      })
    }
  }

  const toggleDisponible = async () => {
    if (!espacio) return
    const res = await fetch(`/api/espacios/${espacio.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponible: !espacio.disponible }),
    })
    if (res.ok) setEspacio(prev => prev ? { ...prev, disponible: !prev.disponible } : prev)
  }

  if (status === 'loading' || (!espacio && !forbidden)) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/40">
        <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
        Cargando...
      </div>
    </div>
  )

  if (forbidden || !espacio) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <p className="text-white/40">No tienes acceso a este espacio</p>
      <Link href="/dashboard" className="text-amber-400 hover:text-amber-300 text-sm">← Volver al dashboard</Link>
    </div>
  )

  const photo = espacio.imagenes?.[0] ?? espacio.imagen_url
  const maxVistas = Math.max(1, ...(stats?.vistasPorDia.map(v => v.count) ?? [1]))

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* nav */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
            ← Volver al dashboard
          </Link>
          <Link href={`/espacio/${espacio.id}`} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
            Ver página pública →
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">

        {/* header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#2D4A3E]/60 border border-[#2D4A3E] flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
              {photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photo} alt={espacio.titulo} className="w-full h-full object-cover" />
                : TIPO_ICON[espacio.tipo] ?? '📁'
              }
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs bg-white/8 text-white/60 rounded-full px-2.5 py-0.5">
                  {TIPO_LABEL[espacio.tipo] ?? espacio.tipo}
                </span>
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${espacio.disponible ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                  {espacio.disponible ? '● Activo' : '○ Inactivo'}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">{espacio.titulo}</h1>
              <p className="text-white/40 text-sm mt-0.5">{espacio.comuna} · <span className="text-[#C9A84C] font-semibold">{fmt(espacio.precio_mensual)}/mes</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="text-sm font-medium px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all"
            >
              Editar
            </button>
            <button
              onClick={toggleDisponible}
              className={`text-sm font-medium px-4 py-2 rounded-xl border transition-all ${
                espacio.disponible ? 'border-red-400/20 text-red-400 hover:bg-red-400/10' : 'border-green-400/20 text-green-400 hover:bg-green-400/10'
              }`}
            >
              {espacio.disponible ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </div>

        {/* stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Total de vistas</p>
            <p className="text-3xl font-black text-white">{stats?.totalVistas ?? '—'}</p>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Vistas esta semana</p>
            <p className="text-3xl font-black text-[#C9A84C]">{stats?.vistasSemanaActual ?? '—'}</p>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Solicitudes</p>
            <p className="text-3xl font-black text-white mb-2">{stats?.reservas.total ?? '—'}</p>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE.pendiente}`}>{stats?.reservas.pendientes ?? 0} pend.</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE.aprobada}`}>{stats?.reservas.aprobadas ?? 0} aprob.</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE.rechazada}`}>{stats?.reservas.rechazadas ?? 0} rech.</span>
            </div>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Mensajes recibidos</p>
            <p className="text-3xl font-black text-white">{stats?.mensajesTotal ?? '—'}</p>
            {!!stats?.mensajesNoLeidos && (
              <p className="text-xs text-amber-400 font-semibold mt-2">{stats.mensajesNoLeidos} sin leer</p>
            )}
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1 mb-6 w-fit">
          {([
            { key: 'solicitudes', label: 'Solicitudes' },
            { key: 'mensajes', label: 'Preguntas y mensajes' },
            { key: 'vistas', label: 'Vistas en el tiempo' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key ? 'bg-amber-400 text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* solicitudes tab */}
        {tab === 'solicitudes' && (
          <div className="space-y-3">
            {solicitudes.length === 0 ? (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-white/40 text-sm">Aún no tienes solicitudes de arriendo</p>
              </div>
            ) : solicitudes.map(s => (
              <div key={s.id} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2D4A3E] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {s.usuario_nombre?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{s.usuario_nombre}</p>
                    <p className="text-xs text-white/30">{s.usuario_email}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {formatDate(s.fecha_inicio)} → {formatDate(s.fecha_fin)} · {s.meses} mes{s.meses > 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_BADGE[s.estado] ?? 'bg-white/10 text-white/40'}`}>
                    {s.estado}
                  </span>
                  <p className="text-sm font-black text-[#C9A84C]">{fmt(s.precio_total)}</p>
                  {s.estado === 'pendiente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => responder(s.id, 'rechazada')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => responder(s.id, 'aprobada')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 transition-all"
                      >
                        Aprobar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* mensajes tab */}
        {tab === 'mensajes' && (
          <div className="grid gap-4 md:grid-cols-[260px_1fr]">
            <div className="space-y-2">
              {hilos.length === 0 ? (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
                  <p className="text-white/30 text-sm">Sin conversaciones aún</p>
                </div>
              ) : hilos.map(h => {
                const otherName = h.de_usuario_id === meId ? h.para_nombre : h.de_nombre
                const isActive = activeHilo?.id === h.id
                return (
                  <button
                    key={h.id}
                    onClick={() => setActiveHilo(h)}
                    className={`w-full text-left bg-white/3 border rounded-2xl p-3 transition-all ${isActive ? 'border-amber-400/40 bg-amber-400/5' : 'border-white/8 hover:border-white/15'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white truncate">{otherName}</span>
                      <span className="text-xs text-white/25 flex-shrink-0">{timeAgo(h.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/40 truncate">{h.mensaje}</p>
                      {h.no_leidos > 0 && (
                        <span className="w-5 h-5 bg-amber-400 text-black rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ml-2">
                          {h.no_leidos}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <div>
              {activeHilo && meId !== null ? (
                <ConversationPanel espacioId={espacio.id} hilo={activeHilo} meId={meId} />
              ) : (
                <div className="bg-white/3 border border-white/8 rounded-2xl h-[420px] flex items-center justify-center">
                  <p className="text-white/30 text-sm">Selecciona una conversación</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* vistas tab */}
        {tab === 'vistas' && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-6">Últimos 14 días</p>
            <div className="flex items-end gap-2 h-40">
              {stats?.vistasPorDia.map(v => (
                <div key={v.fecha} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-xs text-white/40 font-semibold">{v.count > 0 ? v.count : ''}</span>
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-amber-400 to-amber-300"
                    style={{ height: `${Math.max(4, (v.count / maxVistas) * 100)}%`, opacity: v.count === 0 ? 0.08 : 1 }}
                  />
                  <span className="text-xs text-white/25">{formatDay(v.fecha)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showEdit && (
        <EditModal
          espacio={espacio}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setEspacio(updated); setShowEdit(false) }}
        />
      )}
    </div>
  )
}
