import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const EDITABLE_FIELDS = ['titulo', 'descripcion', 'precio_mensual', 'metros_cuadrados', 'comuna', 'direccion', 'disponible'] as const

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const result = await pool.query(
      `SELECT e.*, u.nombre as oferente_nombre, u.email as oferente_email, u.telefono as oferente_telefono
       FROM espacios e
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE e.id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const ownerResult = await pool.query(`SELECT usuario_id FROM espacios WHERE id = $1`, [id])
    if (ownerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 })
    }
    if (String(ownerResult.rows[0].usuario_id) !== String(session.user.id)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const updates = EDITABLE_FIELDS.filter(f => f in body)
    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
    }

    const setClause = updates.map((f, i) => `${f} = $${i + 1}`).join(', ')
    const values = updates.map(f => body[f])

    const result = await pool.query(
      `UPDATE espacios SET ${setClause} WHERE id = $${updates.length + 1} RETURNING *`,
      [...values, id]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}