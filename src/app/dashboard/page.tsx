'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'

interface Espacio {
  id: string
  titulo: string
  tipo: string
  precio_mensual: number
  metros_cuadrados: number | null
  comuna: string
  disponible: boolean
  created_at: string
  vistas_total: number
  solicitudes_pendientes: number
}

const TIPO_LABEL: Record<string, string> = {
  bodega: 'Bodega', garage: 'Garage', patio: 'Patio',
  pieza: 'Pieza', estacionamiento: 'Estacionamiento', otro: 'Otro'
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/espacios?usuario_id=${session.user.id}`)
        .then(r => r.json())
        .then(data => { setEspacios(Array.isArray(data) ? data : []); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [session])

  const toggleDisponible = async (id: string, current: boolean) => {
    await fetch(`/api/espacios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponible: !current })
    })
    setEspacios(prev => prev.map(e => e.id === id ? { ...e, disponible: !current } : e))
  }

  const activos = espacios.filter(e => e.disponible)
  const potencial = activos.reduce((sum, e) => sum + e.precio_mensual, 0)
  const fmt = (n: number) => '$' + n.toLocaleString('es-CL')

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/40">
        <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
        Cargando...
      </div>
    </div>
  )

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
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/40 hidden lg:block">
              Hola, <span className="text-white/70">{session?.user?.name}</span>
            </span>
            <Link href="/explorar" className="text-sm text-white/50 hover:text-white transition-colors hidden lg:block">Explorar</Link>
            <Link href="/mensajes" className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block">Mensajes</Link>
            <Link href="/perfil" className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block">Perfil</Link>
            <Link
              href="/dashboard/nuevo"
              className="bg-amber-400 text-black font-bold text-sm px-4 py-2 rounded-lg hover:bg-amber-300 transition-all"
            >
              + Publicar espacio
            </Link>
            <NotificationBell />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-white/40 hover:text-white/70 transition-colors px-3 py-2"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* header */}
        <div className="mb-8">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Panel de control</p>
          <h1 className="text-3xl font-black tracking-tight">Mis espacios</h1>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total publicados', value: espacios.length, sub: 'espacios en tu cuenta', color: 'text-white' },
            { label: 'Activos ahora', value: activos.length, sub: `de ${espacios.length} disponibles`, color: 'text-green-400' },
            { label: 'Ingreso potencial', value: fmt(potencial), sub: 'por mes con espacios activos', color: 'text-[#C9A84C]' },
          ].map(s => (
            <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{s.label}</p>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/30 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* explore CTA */}
        <div className="bg-[#2D4A3E]/20 border border-[#2D4A3E]/40 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white">Explorar el mercado</p>
            <p className="text-sm text-white/40 mt-0.5">Ve todos los espacios disponibles en el mapa interactivo</p>
          </div>
          <Link
            href="/explorar"
            className="bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-amber-300 transition-all whitespace-nowrap flex-shrink-0"
          >
            Explorar espacios →
          </Link>
        </div>

        {/* spaces */}
        {espacios.length === 0 ? (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-bold mb-2">Aún no tienes espacios publicados</h3>
            <p className="text-white/40 text-sm mb-6">Publica tu primer espacio y empieza a generar ingresos</p>
            <Link
              href="/dashboard/nuevo"
              className="inline-flex items-center gap-2 bg-amber-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-300 transition-all"
            >
              Publicar mi primer espacio →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {espacios.map(e => (
              <Link
                key={e.id}
                href={`/dashboard/espacio/${e.id}`}
                className="bg-white/3 border border-white/8 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/12 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2D4A3E]/60 border border-[#2D4A3E] flex items-center justify-center text-xl flex-shrink-0">
                    {e.tipo === 'bodega' ? '📦' : e.tipo === 'garage' ? '🚗' : e.tipo === 'patio' ? '🌿' : e.tipo === 'pieza' ? '🏠' : e.tipo === 'estacionamiento' ? '🅿️' : '📁'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs bg-white/8 text-white/60 rounded-full px-2.5 py-0.5 capitalize">
                        {TIPO_LABEL[e.tipo] ?? e.tipo}
                      </span>
                      <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${e.disponible ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                        {e.disponible ? '● Activo' : '○ Inactivo'}
                      </span>
                      {e.solicitudes_pendientes > 0 && (
                        <span className="text-xs rounded-full px-2.5 py-0.5 font-medium bg-amber-400/10 text-amber-400">
                          {e.solicitudes_pendientes} solicitud{e.solicitudes_pendientes > 1 ? 'es' : ''} pendiente{e.solicitudes_pendientes > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white">{e.titulo}</h3>
                    <p className="text-sm text-white/40 mt-0.5">
                      {e.comuna}
                      {e.metros_cuadrados ? ` · ${e.metros_cuadrados} m²` : ''}
                      {' · '}
                      <span className="text-[#C9A84C] font-semibold">{fmt(e.precio_mensual)}/mes</span>
                    </p>
                    <p className="text-xs text-white/30 mt-1.5 flex items-center gap-1">
                      <span>👁</span> {e.vistas_total ?? 0} vista{(e.vistas_total ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={e2 => { e2.preventDefault(); e2.stopPropagation(); toggleDisponible(e.id, e.disponible) }}
                  className={`text-sm font-medium px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
                    e.disponible
                      ? 'border-red-400/20 text-red-400 hover:bg-red-400/10'
                      : 'border-green-400/20 text-green-400 hover:bg-green-400/10'
                  }`}
                >
                  {e.disponible ? 'Desactivar' : 'Activar'}
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
