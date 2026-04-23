'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  disponible: boolean
  oferente_nombre: string
  oferente_email: string
  oferente_telefono: string
}

export default function DetalleEspacio() {
  const { id } = useParams()
  const [espacio, setEspacio] = useState<Espacio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/espacios/${id}`)
      .then(res => res.json())
      .then(data => {
        setEspacio(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  if (!espacio) return <div className="min-h-screen flex items-center justify-center text-gray-400">Espacio no encontrado</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <Link href="/buscar" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Volver a búsqueda</Link>

        <div className="bg-white rounded-2xl border p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-3 py-1 font-medium capitalize">{espacio.tipo}</span>
            {espacio.disponible ? (
              <span className="text-xs bg-green-50 text-green-600 rounded-full px-3 py-1 font-medium">Disponible</span>
            ) : (
              <span className="text-xs bg-red-50 text-red-600 rounded-full px-3 py-1 font-medium">No disponible</span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{espacio.titulo}</h1>
          <p className="text-3xl font-bold text-blue-600 mb-4">${espacio.precio_mensual.toLocaleString()}<span className="text-base font-normal text-gray-400">/mes</span></p>

          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-400">Comuna</p>
              <p className="text-sm font-medium text-gray-900">{espacio.comuna}</p>
            </div>
            {espacio.metros_cuadrados && (
              <div>
                <p className="text-xs text-gray-400">Tamaño</p>
                <p className="text-sm font-medium text-gray-900">{espacio.metros_cuadrados} m²</p>
              </div>
            )}
            {espacio.direccion && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400">Dirección</p>
                <p className="text-sm font-medium text-gray-900">{espacio.direccion}</p>
              </div>
            )}
          </div>

          {espacio.descripcion && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{espacio.descripcion}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Contactar al oferente</h2>
            <p className="text-sm font-medium text-gray-900 mb-2">{espacio.oferente_nombre}</p>
            <div className="flex flex-col gap-2">
              <a href={`mailto:${espacio.oferente_email}`} className="text-sm text-blue-600 hover:underline">{espacio.oferente_email}</a>
              {espacio.oferente_telefono && (
                <a href={`tel:${espacio.oferente_telefono}`} className="text-sm text-blue-600 hover:underline">{espacio.oferente_telefono}</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}