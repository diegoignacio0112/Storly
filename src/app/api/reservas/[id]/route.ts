import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const { estado } = await request.json()
    if (!['aprobada', 'rechazada'].includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const reservaResult = await pool.query(
      `SELECT r.id, e.usuario_id as propietario_id
       FROM reservas r JOIN espacios e ON r.espacio_id = e.id
       WHERE r.id = $1`,
      [id]
    )
    if (reservaResult.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    }
    if (String(reservaResult.rows[0].propietario_id) !== String(session.user.id)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const result = await pool.query(
      `UPDATE reservas SET estado = $1 WHERE id = $2 RETURNING *`,
      [estado, id]
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
