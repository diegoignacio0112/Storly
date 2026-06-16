'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { MapEspacio } from './MapView'

// ─── types ───────────────────────────────────────────────────────────────────

interface Espacio {
  id: number
  titulo: string
  tipo: string
  precio_mensual: number
  metros_cuadrados: number | null
  comuna: string
  descripcion: string | null
  disponible: boolean
  imagen_url: string | null
  imagenes: string[] | null
  lat: number | null
  lng: number | null
  created_at: string
}

type SortKey = 'newest' | 'price' | 'distance'

// ─── helpers ─────────────────────────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function formatDist(km: number) {
  return km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km'
}

// ─── dynamic map import ───────────────────────────────────────────────────────

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#0d0d14] flex items-center justify-center">
      <div className="flex items-center gap-2 text-white/30 text-sm">
        <div className="w-4 h-4 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
        Cargando mapa...
      </div>
    </div>
  ),
})

// ─── Select dropdown ─────────────────────────────────────────────────────────

function Select({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 bg-white/5 border rounded-lg px-3 py-2 text-sm text-white whitespace-nowrap transition-all ${open ? 'border-amber-400/50' : 'border-white/10 hover:border-white/20'}`}
      >
        {selected?.label}
        <svg className={`w-3 h-3 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/60 min-w-[170px]">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === opt.value
                  ? 'bg-amber-400/10 text-amber-300 font-medium'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SpaceCard ────────────────────────────────────────────────────────────────

const TIPO_ICON: Record<string, string> = {
  bodega: '📦', garage: '🚗', patio: '🌿',
  pieza: '🏠', estacionamiento: '🅿️', otro: '📁',
}
const TIPO_LABEL: Record<string, string> = {
  bodega: 'Bodega', garage: 'Garage', patio: 'Patio',
  pieza: 'Pieza', estacionamiento: 'Estacionamiento', otro: 'Otro',
}

function SpaceCard({
  space, distance, hovered, onHover, cardRef,
}: {
  space: Espacio
  distance: number | null
  hovered: boolean
  onHover: (id: number | null) => void
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  const photo = space.imagenes?.[0] ?? space.imagen_url

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => onHover(space.id)}
      onMouseLeave={() => onHover(null)}
      className={`flex gap-3 p-3 rounded-xl border transition-all ${
        hovered
          ? 'bg-white/8 border-amber-400/30'
          : 'bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15'
      }`}
    >
      {/* thumbnail */}
      <div className="w-[68px] h-[68px] flex-shrink-0 rounded-lg overflow-hidden bg-[#2D4A3E]/30 border border-white/5 flex items-center justify-center">
        {photo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={photo} alt={space.titulo} className="w-full h-full object-cover" />
          : <span className="text-2xl">{TIPO_ICON[space.tipo] ?? '📁'}</span>
        }
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 mb-1">{space.titulo}</h3>
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span className="text-xs bg-white/8 text-white/50 px-2 py-0.5 rounded-full">
            {TIPO_LABEL[space.tipo] ?? space.tipo}
          </span>
          <span className="text-xs text-green-400 font-medium">● Disponible</span>
        </div>
        <div className="text-sm font-bold text-[#C9A84C]">
          ${space.precio_mensual.toLocaleString('es-CL')}
          <span className="text-white/30 font-normal text-xs">/mes</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/30 truncate">
            {distance !== null ? formatDist(distance) + ' · ' : ''}{space.comuna}
          </span>
          <Link
            href={`/espacio/${space.id}`}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors flex-shrink-0 ml-2"
          >
            Ver →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── filter options ───────────────────────────────────────────────────────────

const TIPO_OPTS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'garage', label: 'Garage' },
  { value: 'patio', label: 'Patio' },
  { value: 'pieza', label: 'Pieza' },
  { value: 'estacionamiento', label: 'Estacionamiento' },
  { value: 'otro', label: 'Otro' },
]

const SORT_OPTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Más nuevos' },
  { value: 'price', label: 'Menor precio' },
  { value: 'distance', label: 'Más cercanos' },
]

const MAX_PRICE = 1_500_000

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ExplorarPage() {
  const [spaces, setSpaces] = useState<Espacio[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)
  const [sort, setSort] = useState<SortKey>('newest')

  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    fetch('/api/espacios')
      .then(r => r.json())
      .then(data => { setSpaces(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    )
  }, [])

  // scroll hovered card into view when activated from map click
  useEffect(() => {
    if (hoveredId !== null) {
      cardRefs.current[hoveredId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [hoveredId])

  // filter + sort
  const filtered = spaces
    .filter(s => {
      if (search) {
        const q = search.toLowerCase()
        if (!s.titulo.toLowerCase().includes(q) && !s.comuna.toLowerCase().includes(q)) return false
      }
      if (tipoFilter && s.tipo !== tipoFilter) return false
      if (s.precio_mensual > maxPrice) return false
      return true
    })
    .map(s => ({
      ...s,
      distance:
        userLocation && s.lat !== null && s.lng !== null
          ? haversine(userLocation[0], userLocation[1], s.lat, s.lng)
          : null,
    }))
    .sort((a, b) => {
      if (sort === 'price') return a.precio_mensual - b.precio_mensual
      if (sort === 'distance') {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const mapSpaces: MapEspacio[] = filtered
    .filter(s => s.lat !== null && s.lng !== null)
    .map(s => ({
      id: s.id, titulo: s.titulo,
      precio_mensual: s.precio_mensual, comuna: s.comuna,
      lat: s.lat!, lng: s.lng!,
    }))

  const hasActiveFilters = search !== '' || tipoFilter !== '' || maxPrice < MAX_PRICE
  const fmtPrice = (p: number) => '$' + p.toLocaleString('es-CL')

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden">

      {/* ── nav ─────────────────────────────────────────────────────────── */}
      <nav className="flex-shrink-0 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-black font-black text-xs">S</span>
            </div>
            <span className="font-bold tracking-tight hidden sm:block">Storly</span>
          </Link>

          {/* search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o comuna..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50 transition-all"
            />
          </div>

          {/* filters */}
          <div className="hidden sm:flex items-center gap-2">
            <Select value={tipoFilter} onChange={setTipoFilter} options={TIPO_OPTS} />
            <div className="flex items-center gap-2 flex-shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="text-xs text-white/40 whitespace-nowrap">Hasta {fmtPrice(maxPrice)}</span>
              <input
                type="range"
                min={50_000}
                max={MAX_PRICE}
                step={50_000}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-20 accent-amber-400"
              />
            </div>
            <Select value={sort} onChange={v => setSort(v as SortKey)} options={SORT_OPTS} />
          </div>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <Link href="/auth/login" className="text-sm text-white/50 hover:text-white transition-colors hidden lg:block">Iniciar sesión</Link>
            <Link href="/auth/registro" className="text-sm bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap">
              Comenzar
            </Link>
          </div>
        </div>

        {/* mobile filters row */}
        <div className="sm:hidden px-4 pb-3 flex items-center gap-2 overflow-x-auto">
          <Select value={tipoFilter} onChange={setTipoFilter} options={TIPO_OPTS} />
          <Select value={sort} onChange={v => setSort(v as SortKey)} options={SORT_OPTS} />
          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-white/40 whitespace-nowrap">
            <span>Hasta {fmtPrice(maxPrice)}</span>
            <input
              type="range"
              min={50_000}
              max={MAX_PRICE}
              step={50_000}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-20 accent-amber-400"
            />
          </div>
        </div>
      </nav>

      {/* ── content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* map */}
        <div className="h-[300px] lg:h-auto lg:flex-1">
          <MapView
            spaces={mapSpaces}
            userLocation={userLocation}
            hoveredId={hoveredId}
            onMarkerClick={id => setHoveredId(prev => prev === id ? null : id)}
          />
        </div>

        {/* sidebar */}
        <div className="lg:w-[380px] flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-white/5 overflow-hidden">

          {/* count + clear */}
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm text-white/50">
              <span className="text-white font-semibold">{loading ? '—' : filtered.length}</span>
              {' '}espacio{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => { setSearch(''); setTipoFilter(''); setMaxPrice(MAX_PRICE) }}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[88px] bg-white/3 border border-white/5 rounded-xl animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <span className="text-4xl mb-3">🔍</span>
                <p className="text-white/40 text-sm">No hay espacios con esos filtros</p>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(''); setTipoFilter(''); setMaxPrice(MAX_PRICE) }}
                    className="mt-3 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Ver todos los espacios
                  </button>
                )}
              </div>
            ) : (
              filtered.map(({ distance, ...space }) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  distance={distance}
                  hovered={hoveredId === space.id}
                  onHover={setHoveredId}
                  cardRef={el => { cardRefs.current[space.id] = el }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
