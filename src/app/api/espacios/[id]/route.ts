import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { disponible } = await request.json()

    const result = await pool.query(
      'UPDATE espacios SET disponible = $1 WHERE id = $2 RETURNING *',
      [disponible, id]
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

