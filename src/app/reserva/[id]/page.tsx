'use client'
import { useState, useEffect, useRef, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// ─── types ────────────────────────────────────────────────────────────────────

interface Reserva {
  id: number
  espacio_id: number
  usuario_id: number
  espacio_usuario_id: number
  fecha_inicio: string
  fecha_fin: string
  precio_total: number
  precio_seguro: number
  meses: number
  seguro: string
  estado: string
  created_at: string
  checkin_fotos: string[] | null
  checkin_fecha: string | null
  checkin_notas: string | null
  checkout_fotos: string[] | null
  checkout_fecha: string | null
  checkout_notas: string | null
  disputa: boolean
  espacio_titulo: string
  espacio_tipo: string
  espacio_comuna: string
  espacio_imagenes: string[] | null
  precio_mensual: number
  usuario_nombre: string
}

type StageStatus = 'done' | 'current' | 'future' | 'rejected'
interface Stage { key: string; label: string; icon: string; date: string | null; status: StageStatus }

// ─── helpers ──────────────────────────────────────────────────────────────────

const TIPO_ICON: Record<string, string> = {
  bodega: '📦', garage: '🚗', patio: '🌿',
  pieza: '🏠', estacionamiento: '🅿️', otro: '📁',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente de aprobación',
  aprobada: 'Aprobada',
  en_uso: 'En uso',
  finalizada: 'Finalizada',
  rechazada: 'Rechazada',
  disputa: 'En disputa',
}
const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-amber-400/10 text-amber-400',
  aprobada: 'bg-[#2D4A3E]/40 text-[#C8D9B0]',
  en_uso: 'bg-green-400/10 text-green-400',
  finalizada: 'bg-white/10 text-white/50',
  rechazada: 'bg-red-400/10 text-red-400',
  disputa: 'bg-orange-400/10 text-orange-400',
}

const fmt = (n: number) => '$' + n.toLocaleString('es-CL')
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
const formatDateTime = (d: string) => new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) + ', ' +
  new Date(d).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

function getStages(r: Reserva): Stage[] {
  const base: Omit<Stage, 'status'>[] = [
    { key: 'solicitud', label: 'Solicitud enviada', icon: '📝', date: r.created_at },
    { key: 'aprobada', label: 'Aprobada por el oferente', icon: '✅', date: null },
    { key: 'checkin', label: 'Check-in (evidencia inicial)', icon: '📸', date: r.checkin_fecha },
    { key: 'en_uso', label: 'En uso', icon: '📦', date: null },
    { key: 'checkout', label: 'Check-out (evidencia final)', icon: '🔍', date: r.checkout_fecha },
    { key: 'finalizada', label: 'Finalizada', icon: '🏁', date: r.checkout_fecha },
  ]

  if (r.estado === 'rechazada') {
    return base.map((s, i) => ({ ...s, status: i === 0 ? 'done' : i === 1 ? 'rejected' : 'future' }))
  }

  let currentIdx = 1
  if (r.estado === 'aprobada') currentIdx = 2
  else if (r.estado === 'en_uso' || r.checkin_fecha) currentIdx = 3
  if (r.estado === 'finalizada' || r.checkout_fecha) currentIdx = 6
  if (r.estado === 'disputa') currentIdx = r.checkout_fecha ? 5 : r.checkin_fecha ? 3 : 2

  return base.map((s, i) => ({
    ...s,
    status: r.estado === 'finalizada' ? 'done' : i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'future',
  }))
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ─── timeline ─────────────────────────────────────────────────────────────────

function Timeline({ stages }: { stages: Stage[] }) {
  const circleCls = (status: StageStatus) => {
    if (status === 'done') return 'bg-[#2D4A3E] border-2 border-[#2D4A3E] text-[#C8D9B0]'
    if (status === 'current') return 'bg-[#C9A84C] border-2 border-[#C9A84C] text-black ring-4 ring-amber-400/20'
    if (status === 'rejected') return 'bg-red-500/20 border-2 border-red-500/40 text-red-400'
    return 'bg-white/5 border-2 border-white/10 text-white/20'
  }
  const labelCls = (status: StageStatus) =>
    status === 'future' ? 'text-white/30' : status === 'rejected' ? 'text-red-400' : 'text-white'
  const lineCls = (status: StageStatus) =>
    status === 'done' ? 'bg-[#2D4A3E]' : status === 'rejected' ? 'bg-red-500/40' : 'bg-white/10'

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0">
      {stages.map((s, i) => (
        <Fragment key={s.key}>
          <div className="flex sm:flex-col items-center gap-3 sm:gap-2 sm:flex-1 sm:text-center py-2 sm:py-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 transition-all ${circleCls(s.status)}`}>
              {s.status === 'done' ? '✓' : s.status === 'rejected' ? '✕' : s.icon}
            </div>
            <div>
              <p className={`text-xs sm:text-sm font-semibold ${labelCls(s.status)}`}>{s.label}</p>
              {s.date && <p className="text-xs text-white/30 mt-0.5">{formatDateTime(s.date)}</p>}
            </div>
          </div>
          {i < stages.length - 1 && (
            <div className={`w-0.5 h-4 ml-5 sm:ml-0 sm:w-full sm:h-0.5 sm:mt-5 sm:flex-shrink-0 ${lineCls(s.status)}`} />
          )}
        </Fragment>
      ))}
    </div>
  )
}

// ─── FGL badge ────────────────────────────────────────────────────────────────

function FGLBadge() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 bg-[#2D4A3E]/30 border border-[#2D4A3E]/60 text-[#C8D9B0] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#2D4A3E]/40 transition-all"
      >
        🛡️ Protegido por Garantía Líquida Interna
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#0a0a0f] border border-white/10 rounded-xl p-4 shadow-2xl shadow-black/60 z-50 text-xs text-white/60 leading-relaxed">
          Storly retiene una parte de la comisión para responder ante daños menores comprobables durante las primeras transacciones, mientras se formaliza una póliza con aseguradora.
        </div>
      )}
    </div>
  )
}

// ─── photo evidence form ──────────────────────────────────────────────────────

function PhotoEvidenceForm({
  title, helpText, submitLabel, onSubmit, submitting,
}: {
  title: string
  helpText: string
  submitLabel: string
  onSubmit: (fotos: string[], notas: string) => void
  submitting: boolean
}) {
  const [fotos, setFotos] = useState<string[]>([])
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 8 - fotos.length)
    const compressed = await Promise.all(files.map(compressImage))
    setFotos(prev => [...prev, ...compressed].slice(0, 8))
    setError('')
  }

  const removeFoto = (i: number) => setFotos(prev => prev.filter((_, idx) => idx !== i))

  const submit = () => {
    if (fotos.length < 2) { setError('Sube al menos 2 fotos como evidencia'); return }
    onSubmit(fotos, notas)
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-white/40">{helpText}</p>
      </div>

      <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />
      {fotos.length < 8 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-white/15 rounded-xl py-6 flex flex-col items-center gap-2 text-white/40 hover:border-amber-400/30 hover:text-white/60 transition-all"
        >
          <span className="text-2xl">📷</span>
          <span className="text-sm font-medium">Subir fotos</span>
          <span className="text-xs">Mínimo 2, máximo 8 · JPG, PNG, WEBP</span>
        </button>
      )}

      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {fotos.map((src, i) => (
            <div key={i} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-white/10" />
              <button
                type="button"
                onClick={() => removeFoto(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-full text-white/80 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Notas (opcional)</label>
        <textarea
          rows={3}
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder='Ej: "Inventario: 40 cajas de ropa, sin daños visibles"'
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50 resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="bg-[#2D4A3E]/20 border border-[#2D4A3E]/40 rounded-xl px-4 py-3 text-xs text-[#9BB896]">
        Estas fotos quedan como evidencia. Se comparan al finalizar el arriendo.
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="w-full bg-amber-400 text-black font-bold py-3 rounded-xl hover:bg-amber-300 transition-all disabled:opacity-50"
      >
        {submitting ? 'Guardando...' : submitLabel}
      </button>
    </div>
  )
}

// ─── photo grids ──────────────────────────────────────────────────────────────

function PhotoGrid({ fotos }: { fotos: string[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {fotos.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={src} alt={`Foto ${i + 1}`} className="w-full aspect-square object-cover rounded-xl border border-white/10" />
      ))}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ReservaDetailPage() {
  const { id } = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const reservaId = Array.isArray(id) ? id[0] : id

  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [openForm, setOpenForm] = useState<'checkin' | 'checkout' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (!reservaId) return
    fetch(`/api/reservas?id=${reservaId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setReserva(data))
      .catch(() => setLoadError(true))
  }, [reservaId])

  const meId = session?.user?.id ? Number(session.user.id) : null
  const isRenter = reserva && meId !== null && reserva.usuario_id === meId
  const isOwner = reserva && meId !== null && reserva.espacio_usuario_id === meId

  const submitEvidencia = async (tipo: 'checkin' | 'checkout', fotos: string[], notas: string) => {
    setSubmitting(true)
    const res = await fetch(`/api/reservas/${reservaId}/${tipo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fotos, notas }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) { setReserva(data); setOpenForm(null) }
  }

  if (status === 'loading' || (!reserva && !loadError)) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  )

  if (loadError || !reserva || (!isRenter && !isOwner)) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <p className="text-white/40">No tienes acceso a esta reserva</p>
      <Link href="/dashboard" className="text-amber-400 hover:text-amber-300 text-sm">← Volver al dashboard</Link>
    </div>
  )

  const stages = getStages(reserva)
  const photo = reserva.espacio_imagenes?.[0]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* nav */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-black text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Storly</span>
          </Link>
          <Link
            href={isOwner ? `/dashboard/espacio/${reserva.espacio_id}` : '/perfil'}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8 space-y-6">

        {/* header */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#2D4A3E]/60 border border-[#2D4A3E] flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
              {photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photo} alt={reserva.espacio_titulo} className="w-full h-full object-cover" />
                : TIPO_ICON[reserva.espacio_tipo] ?? '📁'
              }
            </div>
            <div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ESTADO_COLOR[reserva.estado] ?? 'bg-white/10 text-white/40'}`}>
                {ESTADO_LABEL[reserva.estado] ?? reserva.estado}
              </span>
              <h1 className="text-lg font-black tracking-tight mt-1.5">{reserva.espacio_titulo}</h1>
              <p className="text-white/40 text-sm">
                {reserva.espacio_comuna} · {formatDate(reserva.fecha_inicio)} → {formatDate(reserva.fecha_fin)}
              </p>
              {isOwner && <p className="text-xs text-white/30 mt-1">Arrendatario: {reserva.usuario_nombre}</p>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-black text-[#C9A84C]">{fmt(reserva.precio_total)}</p>
            <p className="text-xs text-white/30">{reserva.meses} mes{reserva.meses > 1 ? 'es' : ''} · seguro {reserva.seguro}</p>
          </div>
        </div>

        <FGLBadge />

        {/* timeline */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <Timeline stages={stages} />
        </div>

        {/* rejected banner */}
        {reserva.estado === 'rechazada' && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-5 text-sm">
            Esta solicitud fue rechazada por el oferente.
          </div>
        )}

        {/* dispute banner */}
        {reserva.estado === 'disputa' && (
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl p-5 text-sm">
            Esta reserva está marcada en disputa. Storly revisará la evidencia de check-in y check-out.
          </div>
        )}

        {/* pendiente */}
        {reserva.estado === 'pendiente' && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 text-sm text-white/50">
            Esperando que el oferente apruebe tu solicitud de arriendo.
          </div>
        )}

        {/* aprobada → checkin */}
        {reserva.estado === 'aprobada' && (
          isRenter ? (
            openForm === 'checkin' ? (
              <PhotoEvidenceForm
                title="Check-in: evidencia inicial"
                helpText="Toma fotos del estado del espacio y de tus pertenencias al ingresar."
                submitLabel="Confirmar check-in"
                submitting={submitting}
                onSubmit={(fotos, notas) => submitEvidencia('checkin', fotos, notas)}
              />
            ) : (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-white/50">Tu solicitud fue aprobada. Realiza el check-in para comenzar a usar el espacio.</p>
                <button
                  onClick={() => setOpenForm('checkin')}
                  className="bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-amber-300 transition-all whitespace-nowrap"
                >
                  Realizar check-in
                </button>
              </div>
            )
          ) : (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 text-sm text-white/50">
              El arrendatario debe realizar el check-in con evidencia fotográfica para comenzar el arriendo.
            </div>
          )
        )}

        {/* en_uso → checkout */}
        {reserva.estado === 'en_uso' && (
          <div className="space-y-4">
            {reserva.checkin_fotos && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Evidencia de check-in</p>
                <PhotoGrid fotos={reserva.checkin_fotos} />
                {reserva.checkin_notas && <p className="text-sm text-white/50 mt-3">{reserva.checkin_notas}</p>}
              </div>
            )}
            {isRenter ? (
              openForm === 'checkout' ? (
                <PhotoEvidenceForm
                  title="Check-out: evidencia final"
                  helpText="Toma fotos del estado del espacio antes de finalizar el arriendo."
                  submitLabel="Confirmar check-out"
                  submitting={submitting}
                  onSubmit={(fotos, notas) => submitEvidencia('checkout', fotos, notas)}
                />
              ) : (
                <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-sm text-white/50">Cuando termines de usar el espacio, realiza el check-out.</p>
                  <button
                    onClick={() => setOpenForm('checkout')}
                    className="bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-amber-300 transition-all whitespace-nowrap"
                  >
                    Finalizar y hacer check-out
                  </button>
                </div>
              )
            ) : (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5 text-sm text-white/50">
                El espacio está en uso. El arrendatario realizará el check-out al finalizar el arriendo.
              </div>
            )}
          </div>
        )}

        {/* finalizada → comparison */}
        {reserva.estado === 'finalizada' && reserva.checkin_fotos && reserva.checkout_fotos && (
          <div className="space-y-4">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Comparación de evidencia</p>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-semibold text-[#9BB896] uppercase tracking-widest mb-2">Estado inicial</p>
                  <PhotoGrid fotos={reserva.checkin_fotos} />
                  {reserva.checkin_notas && <p className="text-xs text-white/40 mt-2">{reserva.checkin_notas}</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-widest mb-2">Estado final</p>
                  <PhotoGrid fotos={reserva.checkout_fotos} />
                  {reserva.checkout_notas && <p className="text-xs text-white/40 mt-2">{reserva.checkout_notas}</p>}
                </div>
              </div>
            </div>
            <div className="bg-[#2D4A3E]/20 border border-[#2D4A3E]/40 rounded-2xl p-5 flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="text-sm font-bold text-[#C8D9B0]">Arriendo finalizado · Pago liberado</p>
                <p className="text-xs text-white/40 mt-0.5">Ambas partes pueden revisar la evidencia registrada. El pago se gestiona directamente entre las partes.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
