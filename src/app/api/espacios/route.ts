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

    const { titulo, descripcion, tipo, metros_cuadrados, precio_mensual, comuna, direccion } = await request.json()

    if (!titulo || !tipo || !precio_mensual || !comuna) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO espacios (usuario_id, titulo, descripcion, tipo, metros_cuadrados, precio_mensual, comuna, direccion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [session.user.id, titulo, descripcion, tipo, metros_cuadrados, precio_mensual, comuna, direccion]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
