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
    setEspacios(data)
    setLoading(false)
  }

  useEffect(() => { buscar() }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buscar espacios</h1>
          <p className="text-gray-500">Encuentra el espacio ideal para tu emprendimiento</p>
        </div>

        <div className="bg-white rounded-2xl border p-4 mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Comuna (ej: Santiago)"
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filtros.comuna}
            onChange={e => setFiltros({ ...filtros, comuna: e.target.value })}
          />
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filtros.tipo}
            onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
          >
            <option value="">Todos los tipos</option>
            <option value="bodega">Bodega</option>
            <option value="habitacion">Habitación</option>
            <option value="garage">Garage</option>
            <option value="otro">Otro</option>
          </select>
          <input
            type="number"
            placeholder="Precio máximo"
            className="border rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filtros.maxPrecio}
            onChange={e => setFiltros({ ...filtros, maxPrecio: e.target.value })}
          />
          <button
            onClick={buscar}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Buscar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Buscando espacios...</div>
        ) : espacios.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No se encontraron espacios</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {espacios.map(e => (
              <Link href={`/espacio/${e.id}`} key={e.id}>
                <div className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-1 font-medium capitalize">{e.tipo}</span>
                    <span className="text-sm font-bold text-gray-900">${e.precio_mensual.toLocaleString()}/mes</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{e.titulo}</h3>
                  <p className="text-sm text-gray-500 mb-2">{e.comuna}</p>
                  {e.metros_cuadrados && (
                    <p className="text-xs text-gray-400">{e.metros_cuadrados} m²</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
