import { Pool } from 'pg'
import { URL } from 'url'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const dbUrl = new URL(process.env.DATABASE_URL)
const pool = new Pool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || '5432'),
  database: dbUrl.pathname.slice(1),
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
})

export default pool
