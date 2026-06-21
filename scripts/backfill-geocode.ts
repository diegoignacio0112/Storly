#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local file manually
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=')
    const value = valueParts.join('=').trim()
    if (key && !key.startsWith('#') && !process.env[key.trim()]) {
      process.env[key.trim()] = value
    }
  })
}

// Static imports are hoisted and evaluate before the env-loading code above
// runs, so src/lib/db.ts would throw on a missing DATABASE_URL — import
// dynamically instead, after the env vars are in place.
const { default: pool } = await import('../src/lib/db.ts')
const { geocodeAddress } = await import('../src/lib/geocode.ts')

// Nominatim's usage policy caps anonymous use at ~1 request/second.
const NOMINATIM_DELAY_MS = 1100

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function backfill(): Promise<void> {
  const { rows } = await pool.query(
    `SELECT id, comuna, direccion FROM espacios WHERE lat IS NULL OR lng IS NULL ORDER BY id`
  )

  if (rows.length === 0) {
    console.log('✨ No hay espacios sin coordenadas. Nada que hacer.')
    await pool.end()
    process.exit(0)
  }

  console.log(`📦 Encontrados ${rows.length} espacio(s) sin lat/lng:\n`)

  let updated = 0
  let failed = 0

  for (const row of rows) {
    const result = await geocodeAddress(row.direccion, row.comuna)

    if (result) {
      await pool.query('UPDATE espacios SET lat = $1, lng = $2 WHERE id = $3', [result.lat, result.lng, row.id])
      console.log(`✅ #${row.id} (${row.comuna}) → ${result.lat}, ${result.lng} [${result.source}]`)
      updated++
    } else {
      console.log(`⚠️  #${row.id} (${row.comuna}) → no se pudo geocodificar (comuna desconocida y sin dirección)`)
      failed++
    }

    await sleep(NOMINATIM_DELAY_MS)
  }

  console.log(`\n✅ Backfill completado: ${updated} actualizados, ${failed} sin resolver.`)
  await pool.end()
  process.exit(0)
}

backfill().catch(async (error) => {
  console.error('\n❌ Backfill falló:', error)
  await pool.end()
  process.exit(1)
})
