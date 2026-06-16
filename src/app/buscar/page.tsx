'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Espacio {
  id: string
  titulo: string
  descripcion: string
  tipo: string
  metros_cuadrados: number
  precio_mensual: number
  comuna: string
  direccion: string
  oferente_nombre: string
  oferente_email: string
  oferente_telefono: string
}

const TIPO_LABEL: Record<string, string> = {
  bodega: 'Bodega', garage: 'Garage', patio: 'Patio',
  pieza: 'Pieza', estacionamiento: 'Estacionamiento', otro: 'Otro',
}

const TIPO_ICON: Record<string, string> = {
  bodega: '📦', garage: '🚗', patio: '🌿',
  pieza: '🏠', estacionamiento: '🅿️', otro: '📁',
}

export default function Buscar() {
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({ comuna: '', tipo: '', maxPrecio: '' })

  const buscar = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtros.comuna) params.append('comuna', filtros.comuna)
    if (filtros.tipo) params.append('tipo', filtros.tipo)
    if (filtros.maxPrecio) params.append('maxPrecio', filtros.maxPrecio)
    const res = await fetch(`/api/espacios?${params.toString()}`)
    const data = await res.json()
    setEspacios(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { buscar() }, [])

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
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <Link href="/explorar" className="hover:text-white transition-colors">Mapa</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Mi cuenta</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2 hidden sm:block">
              Iniciar sesión
            </Link>
            <Link href="/auth/registro" className="text-sm bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* header */}
        <div className="mb-8">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Marketplace</p>
          <h1 className="text-3xl font-black tracking-tight">Buscar espacios</h1>
          <p className="text-white/40 mt-1">Encuentra el espacio ideal para guardar lo que necesitas</p>
        </div>

        {/* filter bar */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-8 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">Comuna</label>
            <input
              type="text"
              placeholder="ej: Santiago, Providencia..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50 transition-all"
              value={filtros.comuna}
              onChange={e => setFiltros({ ...filtros, comuna: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && buscar()}
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">Tipo</label>
            <select
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 transition-all"
              value={filtros.tipo}
              onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
            >
              <option value="">Todos los tipos</option>
              <option value="bodega">Bodega</option>
              <option value="garage">Garage</option>
              <option value="patio">Patio</option>
              <option value="pieza">Pieza</option>
              <option value="estacionamiento">Estacionamiento</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wide">Precio máximo</label>
            <input
              type="number"
              placeholder="ej: 200000"
              className="w-40 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50 transition-all"
              value={filtros.maxPrecio}
              onChange={e => setFiltros({ ...filtros, maxPrecio: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && buscar()}
            />
          </div>
          <button
            onClick={buscar}
            disabled={loading}
            className="bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-amber-300 transition-all disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* also try map */}
        <div className="mb-6 flex items-center gap-3">
          <p className="text-sm text-white/30">¿Prefieres buscar en el mapa?</p>
          <Link href="/explorar" className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
            Ver mapa interactivo →
          </Link>
        </div>

        {/* results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-white/3 border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : espacios.length === 0 ? (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">No se encontraron espacios</h3>
            <p className="text-white/40 text-sm">Intenta con otros filtros o revisa más tarde</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/40 mb-4">
              <span className="text-white font-semibold">{espacios.length}</span> espacio{espacios.length !== 1 ? 's' : ''} encontrado{espacios.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {espacios.map(e => (
                <Link href={`/espacio/${e.id}`} key={e.id} className="group">
                  <div className="bg-white/3 border border-white/8 rounded-2xl p-5 hover:bg-white/5 hover:border-white/15 transition-all h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#2D4A3E]/50 border border-[#2D4A3E]/60 flex items-center justify-center text-lg flex-shrink-0">
                          {TIPO_ICON[e.tipo] ?? '📁'}
                        </div>
                        <span className="text-xs bg-white/8 text-white/50 rounded-full px-2.5 py-0.5">
                          {TIPO_LABEL[e.tipo] ?? e.tipo}
                        </span>
                      </div>
                      <span className="text-xs text-green-400 font-medium flex-shrink-0">● Disponible</span>
                    </div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-amber-200 transition-colors line-clamp-1">
                      {e.titulo}
                    </h3>
                    <p className="text-sm text-white/40 mb-3 flex-1">{e.comuna}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-lg font-black text-[#C9A84C]">
                          ${e.precio_mensual.toLocaleString('es-CL')}
                        </span>
                        <span className="text-xs text-white/30">/mes</span>
                      </div>
                      {e.metros_cuadrados ? (
                        <span className="text-xs text-white/30">{e.metros_cuadrados} m²</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
