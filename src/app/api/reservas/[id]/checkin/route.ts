import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const { fotos, notas } = await request.json()
    if (!Array.isArray(fotos) || fotos.length < 2 || fotos.length > 8) {
      return NextResponse.json({ error: 'Debes subir entre 2 y 8 fotos' }, { status: 400 })
    }

    const reservaResult = await pool.query(
      `SELECT r.usuario_id, r.estado, r.espacio_id, e.usuario_id as propietario_id, e.titulo
       FROM reservas r JOIN espacios e ON r.espacio_id = e.id
       WHERE r.id = $1`,
      [id]
    )
    if (reservaResult.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    }
    const reserva = reservaResult.rows[0]
    if (String(reserva.usuario_id) !== String(session.user.id)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (reserva.estado !== 'aprobada') {
      return NextResponse.json({ error: 'El check-in solo está disponible una vez que la reserva fue aprobada' }, { status: 400 })
    }

    const result = await pool.query(
      `UPDATE reservas SET checkin_fotos = $1, checkin_fecha = NOW(), checkin_notas = $2, estado = 'en_uso'
       WHERE id = $3 RETURNING *`,
      [fotos, notas ?? null, id]
    )

    await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, espacio_id, reserva_id)
       VALUES ($1, 'checkin_realizado', 'Check-in realizado', $2, $3, $4)`,
      [
        reserva.propietario_id,
        `${session.user.name} realizó el check-in de "${reserva.titulo}" con evidencia fotográfica`,
        reserva.espacio_id,
        id,
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
