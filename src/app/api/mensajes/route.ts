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
    const { para_usuario_id, espacio_id, mensaje } = await request.json()

    if (!para_usuario_id || !espacio_id || !mensaje?.trim()) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO mensajes (de_usuario_id, para_usuario_id, espacio_id, mensaje)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [session.user.id, para_usuario_id, espacio_id, mensaje.trim()]
    )
    const nuevoMensaje = result.rows[0]

    const espacioResult = await pool.query(`SELECT titulo FROM espacios WHERE id = $1`, [espacio_id])
    const espacioTitulo = espacioResult.rows[0]?.titulo ?? 'tu espacio'
    await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, espacio_id, mensaje_id)
       VALUES ($1, 'nuevo_mensaje', 'Nuevo mensaje', $2, $3, $4)`,
      [
        para_usuario_id,
        `${session.user.name} te escribió sobre "${espacioTitulo}"`,
        espacio_id,
        nuevoMensaje.id,
      ]
    )

    return NextResponse.json(nuevoMensaje, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const espacio_id = searchParams.get('espacio_id')
  const otro_usuario_id = searchParams.get('otro_usuario_id')
  const modoConversaciones = searchParams.get('conversaciones') === 'true'

  const me = session.user.id

  try {
    // Single conversation between two users about a space
    if (espacio_id && otro_usuario_id) {
      const result = await pool.query(
        `SELECT m.*, u.nombre as de_nombre
         FROM mensajes m
         JOIN usuarios u ON m.de_usuario_id = u.id
         WHERE m.espacio_id = $1
           AND (
             (m.de_usuario_id = $2 AND m.para_usuario_id = $3)
             OR
             (m.de_usuario_id = $3 AND m.para_usuario_id = $2)
           )
         ORDER BY m.created_at ASC`,
        [espacio_id, me, otro_usuario_id]
      )
      // Mark as read
      await pool.query(
        `UPDATE mensajes SET leido = true
         WHERE espacio_id = $1 AND de_usuario_id = $2 AND para_usuario_id = $3 AND leido = false`,
        [espacio_id, otro_usuario_id, me]
      )
      return NextResponse.json(result.rows)
    }

    // All conversation threads about one specific space (grouped by other party)
    if (espacio_id && !otro_usuario_id) {
      const result = await pool.query(
        `SELECT DISTINCT ON (LEAST(m.de_usuario_id, m.para_usuario_id), GREATEST(m.de_usuario_id, m.para_usuario_id))
           m.*,
           d.nombre as de_nombre,
           p.nombre as para_nombre,
           (SELECT COUNT(*) FROM mensajes unr
            WHERE unr.espacio_id = m.espacio_id
              AND unr.para_usuario_id = $1
              AND unr.leido = false
              AND (unr.de_usuario_id = m.de_usuario_id OR unr.de_usuario_id = m.para_usuario_id)
           )::int as no_leidos
         FROM mensajes m
         JOIN usuarios d ON m.de_usuario_id = d.id
         JOIN usuarios p ON m.para_usuario_id = p.id
         WHERE m.espacio_id = $2 AND (m.de_usuario_id = $1 OR m.para_usuario_id = $1)
         ORDER BY LEAST(m.de_usuario_id, m.para_usuario_id),
                  GREATEST(m.de_usuario_id, m.para_usuario_id),
                  m.created_at DESC`,
        [me, espacio_id]
      )
      return NextResponse.json(result.rows)
    }

    // All conversations for the current user (grouped)
    if (modoConversaciones) {
      const result = await pool.query(
        `SELECT DISTINCT ON (LEAST(m.de_usuario_id, m.para_usuario_id), GREATEST(m.de_usuario_id, m.para_usuario_id), m.espacio_id)
           m.*,
           e.titulo as espacio_titulo, e.imagenes as espacio_imagenes,
           d.nombre as de_nombre,
           p.nombre as para_nombre,
           (SELECT COUNT(*) FROM mensajes unr
            WHERE unr.espacio_id = m.espacio_id
              AND unr.para_usuario_id = $1
              AND unr.de_usuario_id != $1
              AND unr.leido = false
              AND (
                (unr.de_usuario_id = m.de_usuario_id AND unr.para_usuario_id = m.para_usuario_id)
                OR
                (unr.de_usuario_id = m.para_usuario_id AND unr.para_usuario_id = m.de_usuario_id)
              )
           )::int as no_leidos
         FROM mensajes m
         JOIN espacios e ON m.espacio_id = e.id
         JOIN usuarios d ON m.de_usuario_id = d.id
         JOIN usuarios p ON m.para_usuario_id = p.id
         WHERE m.de_usuario_id = $1 OR m.para_usuario_id = $1
         ORDER BY LEAST(m.de_usuario_id, m.para_usuario_id),
                  GREATEST(m.de_usuario_id, m.para_usuario_id),
                  m.espacio_id,
                  m.created_at DESC`,
        [me]
      )
      return NextResponse.json(result.rows)
    }

    // Unread count
    const result = await pool.query(
      `SELECT COUNT(*)::int as total FROM mensajes WHERE para_usuario_id = $1 AND leido = false`,
      [me]
    )
    return NextResponse.json({ noLeidos: result.rows[0].total })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
