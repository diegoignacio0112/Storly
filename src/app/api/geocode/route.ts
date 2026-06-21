import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { geocodeAddress } from '@/lib/geocode'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { comuna, direccion } = await request.json()
    if (!comuna) {
      return NextResponse.json({ error: 'Falta la comuna' }, { status: 400 })
    }

    const result = await geocodeAddress(direccion, comuna)
    if (!result) {
      return NextResponse.json({ error: 'No se pudo determinar la ubicación' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
