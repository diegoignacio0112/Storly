import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import pool from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const session = await getServerSession(authOptions)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const ipHash = createHash('sha256').update(ip).digest('hex')

    await pool.query(
      `INSERT INTO vistas_espacios (espacio_id, usuario_id, ip_hash) VALUES ($1, $2, $3)`,
      [id, session?.user?.id ?? null, ipHash]
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
