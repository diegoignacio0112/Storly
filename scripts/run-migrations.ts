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

import pool from '../src/lib/db.ts'

const migrationsDir = path.resolve(__dirname, '../src/migrations')

async function getMigrationsFromDisk(): Promise<string[]> {
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'))
  return files.sort()
}

async function getExecutedMigrations(): Promise<Set<string>> {
  try {
    const result = await pool.query('SELECT migration_name FROM migrations_log')
    return new Set(result.rows.map((row) => row.migration_name))
  } catch {
    console.log('📝 Creating migrations_log table...')
    return new Set()
  }
}

async function executeMigration(filename: string): Promise<void> {
  const filepath = path.join(migrationsDir, filename)
  const sql = fs.readFileSync(filepath, 'utf-8')

  // Extract migration name from filename (e.g., "20260612_120000_create_usuarios_table")
  const migrationName = filename.replace('.sql', '')

  try {
    console.log(`⏳ Executing migration: ${migrationName}...`)

    // Execute the SQL file
    await pool.query(sql)

    console.log(`✅ Migration completed: ${migrationName}`)
  } catch (error) {
    console.error(`❌ Error executing migration ${migrationName}:`, error)
    throw error
  }
}

async function runMigrations(): Promise<void> {
  try {
    console.log('\n🔄 Starting migration process...\n')

    const diskMigrations = await getMigrationsFromDisk()
    const executedMigrations = await getExecutedMigrations()

    const pendingMigrations = diskMigrations.filter((m) => !executedMigrations.has(m.replace('.sql', '')))

    if (pendingMigrations.length === 0) {
      console.log('✨ All migrations are up to date!')
      await pool.end()
      process.exit(0)
    }

    console.log(`📦 Found ${pendingMigrations.length} pending migration(s):\n`)

    for (const migration of pendingMigrations) {
      await executeMigration(migration)
    }

    console.log('\n✅ All migrations executed successfully!')
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration process failed:', error)
    await pool.end()
    process.exit(1)
  }
}

runMigrations()
