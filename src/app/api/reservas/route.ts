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
    const { espacio_id, fecha_inicio, fecha_fin, seguro, precio_total, precio_seguro, meses } =
      await request.json()

    if (!espacio_id || !fecha_inicio || !fecha_fin) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO reservas
        (espacio_id, usuario_id, fecha_inicio, fecha_fin, seguro, precio_total, precio_seguro, meses, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente')
       RETURNING *`,
      [espacio_id, session.user.id, fecha_inicio, fecha_fin, seguro, precio_total, precio_seguro, meses]
    )
    const reserva = result.rows[0]

    const espacioResult = await pool.query(
      `SELECT usuario_id, titulo FROM espacios WHERE id = $1`,
      [espacio_id]
    )
    const espacio = espacioResult.rows[0]
    if (espacio) {
      const desde = new Date(fecha_inicio).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
      const hasta = new Date(fecha_fin).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
      await pool.query(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, espacio_id, reserva_id)
         VALUES ($1, 'nueva_reserva', 'Nueva solicitud de arriendo', $2, $3, $4)`,
        [
          espacio.usuario_id,
          `${session.user.name} solicitó arrendar "${espacio.titulo}" del ${desde} al ${hasta}`,
          espacio_id,
          reserva.id,
        ]
      )
    }

    return NextResponse.json(reserva, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(error)
    return NextResponse.json({ error: 'Error interno', detail: msg }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuario_id')
  const id = searchParams.get('id')
  const espacioId = searchParams.get('espacio_id')

  try {
    if (espacioId) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      }
      const espacioResult = await pool.query(`SELECT usuario_id FROM espacios WHERE id = $1`, [espacioId])
      if (espacioResult.rows.length === 0) {
        return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 })
      }
      if (String(espacioResult.rows[0].usuario_id) !== String(session.user.id)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      const result = await pool.query(
        `SELECT r.*, u.nombre as usuario_nombre, u.email as usuario_email
         FROM reservas r
         JOIN usuarios u ON r.usuario_id = u.id
         WHERE r.espacio_id = $1
         ORDER BY r.created_at DESC`,
        [espacioId]
      )
      return NextResponse.json(result.rows)
    }

    if (id) {
      const result = await pool.query(
        `SELECT r.*, e.titulo as espacio_titulo, e.tipo as espacio_tipo,
                e.comuna as espacio_comuna, e.imagenes as espacio_imagenes,
                e.precio_mensual,
                u.nombre as usuario_nombre
         FROM reservas r
         JOIN espacios e ON r.espacio_id = e.id
         JOIN usuarios u ON r.usuario_id = u.id
         WHERE r.id = $1`,
        [id]
      )
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }
      return NextResponse.json(result.rows[0])
    }

    if (usuarioId) {
      const result = await pool.query(
        `SELECT r.*, e.titulo as espacio_titulo, e.tipo as espacio_tipo,
                e.comuna as espacio_comuna, e.imagenes as espacio_imagenes
         FROM reservas r
         JOIN espacios e ON r.espacio_id = e.id
         WHERE r.usuario_id = $1
         ORDER BY r.created_at DESC`,
        [usuarioId]
      )
      return NextResponse.json(result.rows)
    }

    return NextResponse.json({ error: 'Parámetro requerido' }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
