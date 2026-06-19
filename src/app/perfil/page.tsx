'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Perfil {
  id: number
  nombre: string
  email: string
  telefono: string | null
}

interface Reserva {
  id: number
  espacio_titulo: string
  espacio_tipo: string
  espacio_comuna: string
  fecha_inicio: string
  fecha_fin: string
  precio_total: number
  meses: number
  estado: string
}

interface Espacio {
  id: number
  titulo: string
  tipo: string
  comuna: string
  precio_mensual: number
  disponible: boolean
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-amber-400/10 text-amber-400',
  confirmado: 'bg-green-400/10 text-green-400',
  aprobada: 'bg-green-400/10 text-green-400',
  en_uso: 'bg-green-400/10 text-green-400',
  finalizada: 'bg-white/10 text-white/40',
  disputa: 'bg-orange-400/10 text-orange-400',
  cancelado: 'bg-red-400/10 text-red-400',
  rechazada: 'bg-red-400/10 text-red-400',
  completado: 'bg-white/10 text-white/40',
}

const TIPO_ICON: Record<string, string> = {
  bodega: '📦', garage: '🚗', patio: '🌿',
  pieza: '🏠', estacionamiento: '🅿️', otro: '📁',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PerfilPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [tab, setTab] = useState<'info' | 'reservas' | 'espacios'>('info')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (!session?.user?.id) return
    fetch('/api/perfil')
      .then(r => r.json())
      .then(d => { setPerfil(d); setForm({ nombre: d.nombre, telefono: d.telefono ?? '' }) })

    fetch(`/api/reservas?usuario_id=${session.user.id}`)
      .then(r => r.json())
      .then(d => setReservas(Array.isArray(d) ? d : []))

    fetch(`/api/espacios?usuario_id=${session.user.id}`)
      .then(r => r.json())
      .then(d => setEspacios(Array.isArray(d) ? d : []))
  }, [session])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: form.nombre, telefono: form.telefono }),
    })
    const data = await res.json()
    if (res.ok) {
      setPerfil(data)
      setEditMode(false)
      setSaveMsg('Perfil actualizado')
      await update({ name: data.nombre })
      setTimeout(() => setSaveMsg(''), 3000)
    }
    setSaving(false)
  }

  const fmt = (n: number) => '$' + n.toLocaleString('es-CL')
  const totalGastado = reservas.reduce((s, r) => s + (r.precio_total ?? 0), 0)

  if (status === 'loading' || !perfil) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* nav */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-black text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Storly</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/mensajes" className="text-sm text-white/50 hover:text-white transition-colors">Mensajes</Link>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm text-white/30 hover:text-white/60 transition-colors">Salir</button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/20 border border-amber-400/20 flex items-center justify-center text-2xl font-black text-amber-400">
            {perfil.nombre[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Tu cuenta</p>
            <h1 className="text-2xl font-black">{perfil.nombre}</h1>
            <p className="text-white/40 text-sm">{perfil.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Reservas', value: reservas.length, color: 'text-white' },
            { label: 'Total gastado', value: fmt(totalGastado), color: 'text-[#C9A84C]' },
            { label: 'Espacios', value: espacios.length, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/30 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1 mb-6 w-fit">
          {(['info', 'reservas', 'espacios'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                tab === t ? 'bg-amber-400 text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              {t === 'info' ? 'Mi perfil' : t === 'reservas' ? 'Mis reservas' : 'Mis espacios'}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {tab === 'info' && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 max-w-md">
            {saveMsg && (
              <div className="mb-4 bg-[#2D4A3E]/40 border border-[#2D4A3E] text-[#C8D9B0] rounded-xl p-3 text-sm">{saveMsg}</div>
            )}
            {editMode ? (
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Nombre</label>
                  <input
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    value={perfil.email}
                    disabled
                    className="w-full bg-white/3 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white/30 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/20 mt-1">El email no se puede cambiar</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving} className="flex-1 bg-amber-400 text-black font-bold py-2.5 rounded-xl hover:bg-amber-300 transition-all disabled:opacity-50 text-sm">
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)} className="px-4 bg-white/5 border border-white/10 text-white rounded-xl text-sm hover:bg-white/8 transition-all">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Nombre', value: perfil.nombre },
                  { label: 'Email', value: perfil.email },
                  { label: 'Teléfono', value: perfil.telefono ?? 'No registrado' },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-xs text-white/30 uppercase tracking-wide mb-1">{f.label}</p>
                    <p className={`text-sm ${f.value === 'No registrado' ? 'text-white/25' : 'text-white'}`}>{f.value}</p>
                  </div>
                ))}
                <button
                  onClick={() => setEditMode(true)}
                  className="mt-2 bg-white/5 border border-white/10 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-white/8 transition-all"
                >
                  Editar perfil
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reservas tab */}
        {tab === 'reservas' && (
          <div className="space-y-3">
            {reservas.length === 0 ? (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-white/40 text-sm">Aún no tienes reservas</p>
                <Link href="/explorar" className="inline-block mt-4 text-amber-400 hover:text-amber-300 text-sm transition-colors">
                  Explorar espacios →
                </Link>
              </div>
            ) : reservas.map(r => (
              <Link key={r.id} href={`/reserva/${r.id}`} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-start justify-between gap-4 flex-wrap hover:border-white/15 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2D4A3E]/50 flex items-center justify-center text-xl">
                    {TIPO_ICON[r.espacio_tipo] ?? '📁'}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{r.espacio_titulo}</p>
                    <p className="text-xs text-white/40">{r.espacio_comuna}</p>
                    <p className="text-xs text-white/30 mt-1">
                      {formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)} · {r.meses} mes{r.meses > 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_COLOR[r.estado] ?? 'bg-white/10 text-white/40'}`}>
                    {r.estado}
                  </span>
                  <p className="text-sm font-black text-[#C9A84C] mt-2">{fmt(r.precio_total)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Espacios tab */}
        {tab === 'espacios' && (
          <div className="space-y-3">
            <Link
              href="/dashboard/nuevo"
              className="flex items-center justify-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-2xl p-4 hover:bg-amber-400/15 transition-all text-sm font-semibold"
            >
              + Publicar nuevo espacio
            </Link>
            {espacios.length === 0 ? (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
                <p className="text-white/30 text-sm">Aún no has publicado espacios</p>
              </div>
            ) : espacios.map(e => (
              <Link key={e.id} href={`/espacio/${e.id}`} className="block bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{TIPO_ICON[e.tipo] ?? '📁'}</span>
                    <div>
                      <p className="font-bold text-white text-sm">{e.titulo}</p>
                      <p className="text-xs text-white/40">{e.comuna}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${e.disponible ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                      {e.disponible ? '● Activo' : '○ Inactivo'}
                    </span>
                    <p className="text-sm font-black text-[#C9A84C] mt-1">{fmt(e.precio_mensual)}/mes</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
