import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { nombre, email, password, telefono } = await request.json()

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    )

    if (existe.rows.length > 0) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    const password_hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, telefono)
       VALUES ($1, $2, $3, $4) RETURNING id, nombre, email`,
      [nombre, email, password_hash, telefono || null]
    )

    const newUser = result.rows[0]

    // Fire-and-forget — don't fail registration if email fails
    sendWelcomeEmail(newUser.nombre, newUser.email)
      .then(result => {
        console.log('[email] Welcome email sent:', JSON.stringify(result))
      })
      .catch(err => {
        console.error('[email] Welcome email failed for:', newUser.email)
        console.error('[email] Error name:', err?.name)
        console.error('[email] Error message:', err?.message)
        console.error('[email] Error details:', JSON.stringify(err, null, 2))
      })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(error)
    return NextResponse.json(
      { error: 'Error interno del servidor', detail: message },
      { status: 500 }
    )
  }
}
