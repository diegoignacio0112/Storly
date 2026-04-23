'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Espacio {
  id: string
  titulo: string
  tipo: string
  precio_mensual: number
  comuna: string
  disponible: boolean
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status])

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/espacios')
        .then(res => res.json())
        .then(data => {
          const misEspacios = data.filter((e: any) => e.usuario_id === session.user.id)
          setEspacios(misEspacios)
          setLoading(false)
        })
    }
  }, [session])

  const toggleDisponible = async (id: string, disponible: boolean) => {
    await fetch(`/api/espacios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponible: !disponible })
    })
    setEspacios(espacios.map(e => e.id === id ? { ...e, disponible: !disponible } : e))
  }

  if (status === 'loading' || loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis espacios</h1>
            <p className="text-gray-500 text-sm">Hola, {session?.user?.name}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/nuevo" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
              + Publicar espacio
            </Link>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="border rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
              Salir
            </button>
          </div>
        </div>

        {espacios.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <p className="text-gray-400 mb-4">Aún no tienes espacios publicados</p>
            <Link href="/dashboard/nuevo" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
              Publicar mi primer espacio
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {espacios.map(e => (
              <div key={e.id} className="bg-white rounded-2xl border p-5 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-1 capitalize">{e.tipo}</span>
                    <span className={`text-xs rounded-full px-2 py-1 ${e.disponible ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {e.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{e.titulo}</h3>
                  <p className="text-sm text-gray-500">{e.comuna} · ${e.precio_mensual.toLocaleString()}/mes</p>
                </div>
                <button
                  onClick={() => toggleDisponible(e.id, e.disponible)}
                  className="text-sm border rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                >
                  {e.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}