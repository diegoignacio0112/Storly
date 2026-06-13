import { Pool } from 'pg'
import { URL } from 'url'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local file if it exists
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../../.env.local')
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

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Parse the DATABASE_URL to properly handle special characters in password
const dbUrl = new URL(process.env.DATABASE_URL)
const pool = new Pool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || '5432'),
  database: dbUrl.pathname.slice(1),
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  // SSL configuration for cloud-hosted databases (e.g., AWS RDS, Heroku Postgres, Azure Database)
  // Uncomment the line below when deploying to production with a cloud database
  // ssl: { rejectUnauthorized: false }
})

export default pool
