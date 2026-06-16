import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, created_at FROM usuarios WHERE id = $1',
      [session.user.id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const { nombre, telefono } = await request.json()

    const result = await pool.query(
      `UPDATE usuarios SET nombre = COALESCE($1, nombre), telefono = COALESCE($2, telefono)
       WHERE id = $3 RETURNING id, nombre, email, telefono`,
      [nombre || null, telefono || null, session.user.id]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
