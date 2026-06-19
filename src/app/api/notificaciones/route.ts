import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)

  try {
    const result = await pool.query(
      `SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [session.user.id, limit]
    )
    const unreadResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM notificaciones WHERE usuario_id = $1 AND leida = false`,
      [session.user.id]
    )

    return NextResponse.json({
      notificaciones: result.rows,
      noLeidas: unreadResult.rows[0].total,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
