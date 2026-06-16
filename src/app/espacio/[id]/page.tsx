'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// ─── types ────────────────────────────────────────────────────────────────────

interface Espacio {
  id: number
  titulo: string
  descripcion: string | null
  tipo: string
  metros_cuadrados: number | null
  precio_mensual: number
  comuna: string
  direccion: string | null
  disponible: boolean
  caracteristicas: string[] | null
  imagenes: string[] | null
  imagen_url: string | null
  condiciones: string | null
  horario_acceso: string | null
  nombre_contacto: string | null
  telefono_contacto: string | null
  email_contacto: string | null
  oferente_nombre: string
  oferente_email: string
  oferente_telefono: string | null
  usuario_id: number
}

interface Review {
  id: number
  calificacion: number
  comentario: string | null
  autor_nombre: string
  created_at: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  bodega: 'Bodega', garage: 'Garage', patio: 'Patio',
  pieza: 'Pieza', estacionamiento: 'Estacionamiento', otro: 'Otro',
}

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`text-2xl transition-all ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <span className={(hover || value) >= n ? 'text-amber-400' : 'text-white/20'}>★</span>
        </button>
      ))}
    </div>
  )
}

function monthsBetween(start: string, end: string) {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  const diff = e.getTime() - s.getTime()
  if (diff <= 0) return 0
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24 * 30)))
}

// ─── booking modal ────────────────────────────────────────────────────────────

function BookingModal({
  espacio, onClose,
}: {
  espacio: Espacio
  onClose: () => void
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [seguro, setSeguro] = useState<'basico' | 'plus'>('basico')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const meses = monthsBetween(fechaInicio, fechaFin)
  const precioSeguro = seguro === 'plus' ? 5500 : 3500
  const precioBase = espacio.precio_mensual * meses
  const totalSeguro = precioSeguro * meses
  const total = precioBase + totalSeguro

  const fmt = (n: number) => '$' + n.toLocaleString('es-CL')

  const handleConfirm = async () => {
    if (!session?.user) { router.push('/auth/login'); return }
    if (!fechaInicio || !fechaFin || meses === 0) {
      setError('Selecciona fechas válidas')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        espacio_id: espacio.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        seguro,
        precio_total: total,
        precio_seguro: totalSeguro,
        meses,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al reservar'); setLoading(false); return }
    router.push(`/reserva/confirmacion?id=${data.id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0d14] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-xl">✕</button>
        <h2 className="text-xl font-black mb-1">Solicitar arriendo</h2>
        <p className="text-sm text-white/40 mb-5">{espacio.titulo}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Desde</label>
            <input
              type="date"
              min={today}
              value={fechaInicio}
              onChange={e => { setFechaInicio(e.target.value); if (e.target.value > fechaFin) setFechaFin('') }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Hasta</label>
            <input
              type="date"
              min={fechaInicio || today}
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Insurance */}
        <div className="mb-4">
          <label className="block text-xs text-white/40 uppercase tracking-wide mb-2">Seguro de almacenamiento</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'basico', label: 'Básico', price: 3500, desc: 'Cobertura estándar' },
              { key: 'plus', label: 'Plus', price: 5500, desc: 'Cobertura ampliada' },
            ] as const).map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSeguro(opt.key)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  seguro === opt.key
                    ? 'border-amber-400/50 bg-amber-400/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{opt.label}</span>
                  {seguro === opt.key && <span className="text-amber-400 text-xs">✓</span>}
                </div>
                <div className="text-xs text-[#C9A84C] font-semibold">{fmt(opt.price)}/mes</div>
                <div className="text-xs text-white/30 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        {meses > 0 && (
          <div className="bg-white/3 border border-white/8 rounded-xl p-3 mb-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-white/50">
              <span>{fmt(espacio.precio_mensual)} × {meses} mes{meses > 1 ? 'es' : ''}</span>
              <span>{fmt(precioBase)}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Seguro {seguro} × {meses} mes{meses > 1 ? 'es' : ''}</span>
              <span>{fmt(totalSeguro)}</span>
            </div>
            <div className="border-t border-white/8 pt-1.5 flex justify-between font-bold text-white">
              <span>Total</span>
              <span className="text-[#C9A84C]">{fmt(total)}</span>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={loading || meses === 0}
          className="w-full bg-amber-400 text-black font-bold py-3 rounded-xl hover:bg-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : session?.user ? 'Confirmar solicitud' : 'Iniciar sesión para reservar'}
        </button>
      </div>
    </div>
  )
}

// ─── chat floating button ─────────────────────────────────────────────────────

function ChatButton({ espacio }: { espacio: Espacio }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [mensajes, setMensajes] = useState<{ id: number; de_usuario_id: number; de_nombre: string; mensaje: string; created_at: string }[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const hostId = espacio.usuario_id
  const meId = session?.user?.id ? Number(session.user.id) : null

  useEffect(() => {
    if (!open || !meId) return
    const load = () =>
      fetch(`/api/mensajes?espacio_id=${espacio.id}&otro_usuario_id=${hostId}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) && setMensajes(data))
    load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [open, espacio.id, hostId, meId])

  if (!session?.user || meId === hostId) return null

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    await fetch('/api/mensajes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ para_usuario_id: hostId, espacio_id: espacio.id, mensaje: text.trim() }),
    })
    setText('')
    setSending(false)
    fetch(`/api/mensajes?espacio_id=${espacio.id}&otro_usuario_id=${hostId}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setMensajes(data))
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-amber-400 text-black rounded-full flex items-center justify-center shadow-2xl hover:bg-amber-300 transition-all hover:scale-110"
        title="Chatear con el anfitrión"
      >
        <span className="text-2xl">{open ? '✕' : '💬'}</span>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[320px] bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2D4A3E] flex items-center justify-center text-sm font-bold text-white">
              {(espacio.nombre_contacto ?? espacio.oferente_nombre)?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{espacio.nombre_contacto ?? espacio.oferente_nombre}</p>
              <p className="text-xs text-white/30">Anfitrión · {espacio.titulo}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-64">
            {mensajes.length === 0 && (
              <p className="text-center text-xs text-white/30 py-6">Inicia la conversación</p>
            )}
            {mensajes.map(m => {
              const isMe = m.de_usuario_id === meId
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isMe ? 'bg-amber-400 text-black' : 'bg-white/8 text-white'
                  }`}>
                    {m.mensaje}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-3 border-t border-white/8 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Escribe un mensaje..."
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
      )}
    </>
  )
}

// ─── review form ──────────────────────────────────────────────────────────────

function ReviewForm({ espacioId, onSubmitted }: { espacioId: number; onSubmitted: () => void }) {
  const { data: session } = useSession()
  const [stars, setStars] = useState(0)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!session?.user) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stars) return
    setLoading(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ espacio_id: espacioId, calificacion: stars, comentario: text }),
    })
    setDone(true)
    setLoading(false)
    onSubmitted()
  }

  if (done) return (
    <div className="bg-[#2D4A3E]/30 border border-[#2D4A3E] rounded-xl p-4 text-sm text-[#C8D9B0]">
      ¡Gracias por tu reseña!
    </div>
  )

  return (
    <form onSubmit={submit} className="bg-white/3 border border-white/8 rounded-xl p-4">
      <p className="text-sm font-semibold text-white mb-3">Deja tu reseña</p>
      <Stars value={stars} onChange={setStars} />
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Cuenta tu experiencia (opcional)..."
        rows={2}
        className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50 resize-none"
      />
      <button
        type="submit"
        disabled={!stars || loading}
        className="mt-2 bg-amber-400 text-black font-bold text-sm px-4 py-2 rounded-lg hover:bg-amber-300 transition-all disabled:opacity-40"
      >
        {loading ? 'Enviando...' : 'Publicar reseña'}
      </button>
    </form>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function DetalleEspacio() {
  const { id } = useParams()
  const { data: session } = useSession()
  const [espacio, setEspacio] = useState<Espacio | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const espacioId = Array.isArray(id) ? id[0] : id

  const loadReviews = () => {
    if (!espacioId) return
    fetch(`/api/reviews?espacio_id=${espacioId}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setReviews(data))
  }

  useEffect(() => {
    if (!espacioId) return
    fetch(`/api/espacios/${espacioId}`)
      .then(r => r.json())
      .then(data => { setEspacio(data); setLoading(false) })
      .catch(() => setLoading(false))
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espacioId])

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + (r.calificacion ?? 0), 0) / reviews.length
    : null

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/40">
        <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
        Cargando...
      </div>
    </div>
  )

  if (!espacio) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <p className="text-white/40">Espacio no encontrado</p>
      <Link href="/buscar" className="text-amber-400 hover:text-amber-300 text-sm">← Volver a búsqueda</Link>
    </div>
  )

  const photos = [
    ...(espacio.imagenes ?? []),
    ...(espacio.imagen_url && !espacio.imagenes?.includes(espacio.imagen_url) ? [espacio.imagen_url] : []),
  ].filter(Boolean)

  const fmt = (n: number) => '$' + n.toLocaleString('es-CL')

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* nav */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-black text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Storly</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/explorar" className="text-sm text-white/50 hover:text-white transition-colors hidden md:block">← Explorar</Link>
            {session?.user ? (
              <Link href="/dashboard" className="text-sm bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href="/auth/login" className="text-sm bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">

          {/* ── left column ── */}
          <div>
            {/* Photo gallery */}
            <div className="mb-6">
              {photos.length > 0 ? (
                <>
                  <div className="w-full aspect-video bg-[#0d0d14] rounded-2xl overflow-hidden border border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photos[photoIdx]}
                      alt={espacio.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {photos.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {photos.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIdx(i)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            i === photoIdx ? 'border-amber-400' : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full aspect-video bg-[#0d0d14] rounded-2xl border border-white/5 flex items-center justify-center">
                  <span className="text-7xl opacity-40">📦</span>
                </div>
              )}
            </div>

            {/* Title + badges */}
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs bg-white/8 text-white/50 rounded-full px-2.5 py-0.5">
                    {TIPO_LABEL[espacio.tipo] ?? espacio.tipo}
                  </span>
                  <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${
                    espacio.disponible ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                  }`}>
                    {espacio.disponible ? '● Disponible' : '○ No disponible'}
                  </span>
                  {avgRating !== null && (
                    <span className="text-xs text-amber-400 font-semibold">
                      ★ {avgRating.toFixed(1)} ({reviews.length})
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">{espacio.titulo}</h1>
                <p className="text-white/40 mt-1">{espacio.comuna}{espacio.direccion ? ` · ${espacio.direccion}` : ''}</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Precio', value: fmt(espacio.precio_mensual) + '/mes', highlight: true },
                espacio.metros_cuadrados ? { label: 'Tamaño', value: espacio.metros_cuadrados + ' m²', highlight: false } : null,
                espacio.horario_acceso ? { label: 'Acceso', value: espacio.horario_acceso, highlight: false } : null,
              ].filter(Boolean).map(item => (
                <div key={item!.label} className="bg-white/3 border border-white/8 rounded-xl p-3">
                  <p className="text-xs text-white/30 uppercase tracking-wide mb-1">{item!.label}</p>
                  <p className={`text-sm font-bold ${item!.highlight ? 'text-[#C9A84C]' : 'text-white'}`}>{item!.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {espacio.descripcion && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">Descripción</h2>
                <p className="text-white/60 leading-relaxed text-sm">{espacio.descripcion}</p>
              </div>
            )}

            {/* Características */}
            {espacio.caracteristicas && espacio.caracteristicas.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">Características</h2>
                <div className="flex flex-wrap gap-2">
                  {espacio.caracteristicas.map(c => (
                    <span key={c} className="bg-[#2D4A3E]/40 border border-[#2D4A3E]/60 text-[#C8D9B0] text-xs px-3 py-1.5 rounded-full font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {espacio.condiciones && (
              <div className="mb-6 bg-white/3 border border-white/8 rounded-xl p-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-2">Condiciones</h2>
                <p className="text-white/50 text-sm leading-relaxed">{espacio.condiciones}</p>
              </div>
            )}

            {/* Reviews */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">
                  Reseñas {reviews.length > 0 && `(${reviews.length})`}
                </h2>
                {avgRating !== null && (
                  <div className="flex items-center gap-2">
                    <Stars value={Math.round(avgRating)} />
                    <span className="text-sm text-amber-400 font-bold">{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <ReviewForm espacioId={espacio.id} onSubmitted={loadReviews} />

              <div className="mt-4 space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-sm text-white/25 text-center py-4">Sé el primero en dejar una reseña</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="bg-white/3 border border-white/8 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#2D4A3E] flex items-center justify-center text-xs font-bold">
                            {r.autor_nombre?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-white">{r.autor_nombre}</span>
                        </div>
                        <Stars value={r.calificacion ?? 0} />
                      </div>
                      {r.comentario && <p className="text-sm text-white/50">{r.comentario}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── right sidebar ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Price card */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-4">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <span className="text-3xl font-black text-[#C9A84C]">{fmt(espacio.precio_mensual)}</span>
                  <span className="text-white/30 text-sm">/mes</span>
                </div>
                {avgRating !== null && (
                  <span className="text-sm text-white/40">★ {avgRating.toFixed(1)}</span>
                )}
              </div>
              <button
                onClick={() => setShowModal(true)}
                disabled={!espacio.disponible}
                className="w-full bg-amber-400 text-black font-black py-3.5 rounded-xl hover:bg-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {espacio.disponible ? 'Solicitar arriendo' : 'No disponible'}
              </button>
              <p className="text-xs text-white/25 text-center mt-2">Sin cargo hasta que confirmes</p>
            </div>

            {/* Host card */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Anfitrión</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-[#2D4A3E] flex items-center justify-center font-bold text-lg">
                  {(espacio.nombre_contacto ?? espacio.oferente_nombre)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{espacio.nombre_contacto ?? espacio.oferente_nombre}</p>
                  <p className="text-xs text-white/30">Miembro de Storly</p>
                </div>
              </div>
              <div className="space-y-2">
                {(espacio.email_contacto ?? espacio.oferente_email) && (
                  <a
                    href={`mailto:${espacio.email_contacto ?? espacio.oferente_email}`}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-amber-400 transition-colors"
                  >
                    <span className="text-base">✉️</span>
                    {espacio.email_contacto ?? espacio.oferente_email}
                  </a>
                )}
                {(espacio.telefono_contacto ?? espacio.oferente_telefono) && (
                  <a
                    href={`tel:${espacio.telefono_contacto ?? espacio.oferente_telefono}`}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-amber-400 transition-colors"
                  >
                    <span className="text-base">📞</span>
                    {espacio.telefono_contacto ?? espacio.oferente_telefono}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <BookingModal espacio={espacio} onClose={() => setShowModal(false)} />}
      <ChatButton espacio={espacio} />
    </div>
  )
}
