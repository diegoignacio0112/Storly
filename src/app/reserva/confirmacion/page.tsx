'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Reserva {
  id: number
  espacio_titulo: string
  espacio_tipo: string
  espacio_comuna: string
  espacio_imagenes: string[] | null
  fecha_inicio: string
  fecha_fin: string
  seguro: string
  precio_total: number
  meses: number
  estado: string
}

function fmt(n: number) {
  return '$' + n.toLocaleString('es-CL')
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ConfirmacionContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/reservas?id=${id}`)
      .then(r => r.json())
      .then(data => { setReserva(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  )

  if (!reserva) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <p className="text-white/40">Reserva no encontrada</p>
      <Link href="/dashboard" className="text-amber-400 hover:text-amber-300 text-sm">Ir al dashboard →</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-400/10 border border-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="text-3xl font-black">¡Solicitud enviada!</h1>
          <p className="text-white/40 mt-2 text-sm">El anfitrión revisará tu solicitud y te contactará pronto</p>
        </div>

        {/* Booking card */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden mb-6">
          <div className="p-5 border-b border-white/8">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#2D4A3E]/50 flex items-center justify-center text-2xl flex-shrink-0">
                📦
              </div>
              <div>
                <p className="font-bold text-white">{reserva.espacio_titulo}</p>
                <p className="text-sm text-white/40">{reserva.espacio_comuna}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">N° de reserva</span>
              <span className="font-mono font-bold text-amber-400">#{String(reserva.id).padStart(6, '0')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Fecha inicio</span>
              <span className="text-white font-medium">{formatDate(reserva.fecha_inicio)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Fecha fin</span>
              <span className="text-white font-medium">{formatDate(reserva.fecha_fin)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Duración</span>
              <span className="text-white font-medium">{reserva.meses} mes{reserva.meses > 1 ? 'es' : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Seguro</span>
              <span className="text-white font-medium capitalize">{reserva.seguro}</span>
            </div>
            <div className="border-t border-white/8 pt-3 flex justify-between">
              <span className="text-white/40 text-sm">Total</span>
              <span className="text-xl font-black text-[#C9A84C]">{fmt(reserva.precio_total)}</span>
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="bg-[#2D4A3E]/30 border border-[#2D4A3E]/50 rounded-xl p-3 text-xs text-[#C8D9B0]">
              Estado: <span className="font-semibold capitalize">{reserva.estado}</span> · El pago se realiza directamente con el anfitrión
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1 bg-amber-400 text-black font-bold py-3 rounded-xl text-center hover:bg-amber-300 transition-all text-sm">
            Ir al dashboard
          </Link>
          <Link href="/perfil" className="flex-1 bg-white/5 border border-white/10 text-white font-semibold py-3 rounded-xl text-center hover:bg-white/8 transition-all text-sm">
            Mis reservas
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmacionPage() {
  return (
    <Suspense>
      <ConfirmacionContent />
    </Suspense>
  )
}
