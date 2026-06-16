import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST() {
  try {
    await pool.query(`
      ALTER TABLE reservas
        ADD COLUMN IF NOT EXISTS fecha_inicio DATE,
        ADD COLUMN IF NOT EXISTS fecha_fin DATE,
        ADD COLUMN IF NOT EXISTS precio_total DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS seguro VARCHAR(50) DEFAULT 'basico',
        ADD COLUMN IF NOT EXISTS precio_seguro DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS meses INTEGER,
        ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'pendiente';
    `)

    await pool.query(`
      ALTER TABLE reviews
        ADD COLUMN IF NOT EXISTS calificacion INTEGER,
        ADD COLUMN IF NOT EXISTS comentario TEXT;
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mensajes (
        id SERIAL PRIMARY KEY,
        de_usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        para_usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        espacio_id INTEGER REFERENCES espacios(id) ON DELETE CASCADE,
        mensaje TEXT NOT NULL,
        leido BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)

    return NextResponse.json({ ok: true, message: 'Migrations applied' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
