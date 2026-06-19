import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const espacioResult = await pool.query(`SELECT usuario_id FROM espacios WHERE id = $1`, [id])
    if (espacioResult.rows.length === 0) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 })
    }
    if (String(espacioResult.rows[0].usuario_id) !== String(session.user.id)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const totalVistasResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM vistas_espacios WHERE espacio_id = $1`,
      [id]
    )

    const vistasSemanaResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM vistas_espacios WHERE espacio_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
      [id]
    )

    const vistasPorDiaResult = await pool.query(
      `SELECT to_char(created_at::date, 'YYYY-MM-DD') as fecha, COUNT(*)::int as count
       FROM vistas_espacios
       WHERE espacio_id = $1 AND created_at >= NOW() - INTERVAL '14 days'
       GROUP BY fecha
       ORDER BY fecha`,
      [id]
    )
    const countByDay = new Map(vistasPorDiaResult.rows.map(r => [r.fecha, r.count]))
    const vistasPorDia = Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (13 - i))
      const fecha = d.toISOString().slice(0, 10)
      return { fecha, count: countByDay.get(fecha) ?? 0 }
    })

    const reservasResult = await pool.query(
      `SELECT estado, COUNT(*)::int as total FROM reservas WHERE espacio_id = $1 GROUP BY estado`,
      [id]
    )
    const reservas = { pendientes: 0, aprobadas: 0, rechazadas: 0, total: 0 }
    for (const row of reservasResult.rows) {
      reservas.total += row.total
      if (row.estado === 'pendiente') reservas.pendientes = row.total
      else if (row.estado === 'aprobada') reservas.aprobadas = row.total
      else if (row.estado === 'rechazada') reservas.rechazadas = row.total
    }

    const mensajesResult = await pool.query(
      `SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE leido = false)::int as no_leidos
       FROM mensajes WHERE espacio_id = $1 AND para_usuario_id = $2`,
      [id, session.user.id]
    )

    return NextResponse.json({
      totalVistas: totalVistasResult.rows[0].total,
      vistasSemanaActual: vistasSemanaResult.rows[0].total,
      vistasPorDia,
      reservas,
      mensajesNoLeidos: mensajesResult.rows[0].no_leidos,
      mensajesTotal: mensajesResult.rows[0].total,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
