import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const { espacio_id, reserva_id, calificacion, comentario } = await request.json()

    if (!espacio_id || !calificacion || calificacion < 1 || calificacion > 5) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO reviews (espacio_id, usuario_id, reserva_id, calificacion, comentario)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [espacio_id, session.user.id, reserva_id || null, calificacion, comentario || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const espacioId = searchParams.get('espacio_id')

  if (!espacioId) {
    return NextResponse.json({ error: 'espacio_id requerido' }, { status: 400 })
  }

  try {
    const result = await pool.query(
      `SELECT rv.*, u.nombre as autor_nombre
       FROM reviews rv
       JOIN usuarios u ON rv.usuario_id = u.id
       WHERE rv.espacio_id = $1
       ORDER BY rv.created_at DESC`,
      [espacioId]
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
