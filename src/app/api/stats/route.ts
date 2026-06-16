import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const [espacios, usuarios, reservas] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as total FROM espacios WHERE disponible = true'),
      pool.query('SELECT COUNT(*)::int as total FROM usuarios'),
      pool.query('SELECT COUNT(*)::int as total FROM reservas'),
    ])

    return NextResponse.json({
      espacios: espacios.rows[0].total,
      usuarios: usuarios.rows[0].total,
      reservas: reservas.rows[0].total,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ espacios: 0, usuarios: 0, reservas: 0 })
  }
}
