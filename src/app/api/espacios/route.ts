import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const comuna = searchParams.get('comuna')
    const tipo = searchParams.get('tipo')
    const maxPrecio = searchParams.get('maxPrecio')
    const usuarioId = searchParams.get('usuario_id')

    // When fetching own spaces, return all regardless of disponible
    if (usuarioId) {
      const result = await pool.query(
        `SELECT e.*,
           (SELECT COUNT(*) FROM vistas_espacios v WHERE v.espacio_id = e.id)::int as vistas_total,
           (SELECT COUNT(*) FROM reservas r WHERE r.espacio_id = e.id AND r.estado = 'pendiente')::int as solicitudes_pendientes
         FROM espacios e
         WHERE e.usuario_id = $1
         ORDER BY e.created_at DESC`,
        [usuarioId]
      )
      return NextResponse.json(result.rows)
    }

    let query = `
      SELECT e.*, u.nombre as oferente_nombre, u.email as oferente_email, u.telefono as oferente_telefono
      FROM espacios e
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.disponible = true
    `
    const params: (string | number)[] = []
    let i = 1

    if (comuna) {
      query += ` AND LOWER(e.comuna) LIKE LOWER($${i})`
      params.push(`%${comuna}%`)
      i++
    }
    if (tipo) {
      query += ` AND e.tipo = $${i}`
      params.push(tipo)
      i++
    }
    if (maxPrecio) {
      query += ` AND e.precio_mensual <= $${i}`
      params.push(parseInt(maxPrecio))
      i++
    }

    query += ' ORDER BY e.created_at DESC'

    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const {
      titulo, descripcion, tipo, metros_cuadrados, precio_mensual,
      comuna, direccion, disponible,
      nombre_contacto, telefono_contacto, email_contacto,
      horario_acceso, caracteristicas, imagenes, condiciones
    } = await request.json()

    if (!titulo || !tipo || !precio_mensual || !comuna) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO espacios (
        usuario_id, titulo, descripcion, tipo, metros_cuadrados, precio_mensual,
        comuna, direccion, disponible,
        nombre_contacto, telefono_contacto, email_contacto,
        horario_acceso, caracteristicas, imagenes, condiciones
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        session.user.id, titulo, descripcion || null, tipo,
        metros_cuadrados || null, precio_mensual,
        comuna, direccion || null, disponible ?? true,
        nombre_contacto || null, telefono_contacto || null, email_contacto || null,
        horario_acceso || null,
        caracteristicas?.length ? caracteristicas : null,
        imagenes?.length ? imagenes : null,
        condiciones || null
      ]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
