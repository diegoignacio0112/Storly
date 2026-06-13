#!/usr/bin/env node

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const backupsDir = path.resolve(__dirname, '../backups')
const CONTAINER_NAME = process.env.CONTAINER_NAME || 'storly_postgres'

function ensureBackupsDir(): void {
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
  }
}

function generateBackupFilename(): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds()
  return `storly_backup_${timestamp}.sql`
}

function getEnvVariables(): { DB_USER: string; DB_PASSWORD: string; DB_NAME: string; DB_HOST: string; DB_PORT: string } {
  const envPath = path.resolve(__dirname, '../.env.local')
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found. Please create it with DATABASE_URL.')
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const databaseUrl = envContent.match(/DATABASE_URL=(.+)/)?.[1]

  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in .env.local')
  }

  // Parse DATABASE_URL: postgresql://user:password@host:port/database
  const urlRegex = /postgresql:\/\/(.+):(.+)@(.+):(\d+)\/(.+)/
  const match = databaseUrl.match(urlRegex)

  if (!match) {
    throw new Error('Invalid DATABASE_URL format')
  }

  return {
    DB_USER: match[1],
    DB_PASSWORD: match[2],
    DB_NAME: match[5],
    DB_HOST: match[3],
    DB_PORT: match[4],
  }
}

async function exportDatabase(): Promise<void> {
  try {
    console.log('\n📤 Starting database export...\n')

    ensureBackupsDir()

    const env = getEnvVariables()
    const backupFilename = generateBackupFilename()
    const backupPath = path.join(backupsDir, backupFilename)

    console.log(`📁 Backup location: ${backupPath}`)

    // Export database using pg_dump via Docker
    const dumpCommand = `docker exec ${CONTAINER_NAME} pg_dump -U ${env.DB_USER} -d ${env.DB_NAME} --no-password > ${backupPath}`

    execSync(dumpCommand, { stdio: 'inherit' })

    const fileSize = fs.statSync(backupPath).size
    console.log(`✅ Database exported successfully!`)
    console.log(`   File: ${backupFilename}`)
    console.log(`   Size: ${(fileSize / 1024).toFixed(2)} KB\n`)

    console.log('📝 You can share this file with your team or use it to restore the database.')
  } catch (error) {
    console.error('❌ Error exporting database:', error)
    throw error
  }
}

async function importDatabase(filename?: string): Promise<void> {
  try {
    console.log('\n📥 Starting database import...\n')

    ensureBackupsDir()

    let backupFilePath = filename

    if (!backupFilePath) {
      const backupFiles = fs.readdirSync(backupsDir).filter((f) => f.endsWith('.sql')).sort().reverse()

      if (backupFiles.length === 0) {
        throw new Error('No backup files found in backups/ directory')
      }

      backupFilePath = backupFiles[0]
    }

    const fullPath = path.join(backupsDir, backupFilePath)

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Backup file not found: ${fullPath}`)
    }

    const env = getEnvVariables()

    console.log(`📁 Importing from: ${fullPath}`)

    const importCommand = `cat ${fullPath} | docker exec -i ${CONTAINER_NAME} psql -U ${env.DB_USER} -d ${env.DB_NAME}`

    execSync(importCommand, { stdio: 'inherit' })

    console.log(`✅ Database imported successfully!`)
    console.log(`   From: ${backupFilePath}\n`)
  } catch (error) {
    console.error('❌ Error importing database:', error)
    throw error
  }
}

// Determine operation from command line argument
const operation = process.argv[2]

if (operation === 'import') {
  importDatabase(process.argv[3]).catch(() => process.exit(1))
} else {
  exportDatabase().catch(() => process.exit(1))
}
