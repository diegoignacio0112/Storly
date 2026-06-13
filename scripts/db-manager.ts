#!/usr/bin/env node

import * as readline from 'readline'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function showMenu(): Promise<void> {
  console.clear()
  console.log('\n╔════════════════════════════════════════════╗')
  console.log('║     STORLY DATABASE MANAGER                ║')
  console.log('╚════════════════════════════════════════════╝\n')
  console.log('Select an option:\n')
  console.log('  1. Start container')
  console.log('  2. Add migrations')
  console.log('  3. Restart container')
  console.log('  4. Stop container')
  console.log('  5. Export database')
  console.log('  6. Exit\n')
}

async function startContainer(): Promise<void> {
  console.log('\n🚀 Starting PostgreSQL container...')
  try {
    execSync('docker-compose up -d', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })
    console.log('✅ Container started successfully!')
    console.log('   PostgreSQL will run in the background.')
  } catch (error) {
    console.error('❌ Error starting container:', error)
  }
  await question('\nPress Enter to continue...')
}

async function stopContainer(): Promise<void> {
  console.log('\n⏹️  Stopping PostgreSQL container...')
  try {
    execSync('docker-compose stop', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })
    console.log('✅ Container stopped successfully!')
  } catch (error) {
    console.error('❌ Error stopping container:', error)
  }
  await question('\nPress Enter to continue...')
}

async function restartContainer(): Promise<void> {
  console.log('\n🔄 Restarting PostgreSQL container...')
  try {
    execSync('docker-compose restart', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })
    console.log('✅ Container restarted successfully!')
  } catch (error) {
    console.error('❌ Error restarting container:', error)
  }
  await question('\nPress Enter to continue...')
}

async function addMigrations(): Promise<void> {
  console.log('\n📦 Running migrations...')
  try {
    // Check if container is running
    const containerStatus = execSync(
      "docker-compose ps --services --filter 'status=running'",
      { cwd: path.resolve(__dirname, '..') }
    ).toString()

    if (!containerStatus.includes('postgres')) {
      console.log('\n⚠️  Container is not running. Starting it now...')
      execSync('docker-compose up -d', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })
      console.log('   Waiting for container to be ready...')
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    execSync('npx ts-node scripts/run-migrations.ts', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    })
    console.log('✅ Migrations completed successfully!')
  } catch (error) {
    console.error('❌ Error running migrations:', error)
  }
  await question('\nPress Enter to continue...')
}

async function exportDatabase(): Promise<void> {
  console.log('\n📤 Exporting database...')
  try {
    // Check if container is running
    const containerStatus = execSync(
      "docker-compose ps --services --filter 'status=running'",
      { cwd: path.resolve(__dirname, '..') }
    ).toString()

    if (!containerStatus.includes('postgres')) {
      console.error('❌ Container is not running. Please start it first.')
      await question('\nPress Enter to continue...')
      return
    }

    execSync('npx ts-node scripts/export-db.ts', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    })
    console.log('✅ Database exported successfully!')
  } catch (error) {
    console.error('❌ Error exporting database:', error)
  }
  await question('\nPress Enter to continue...')
}

async function main(): Promise<void> {
  let running = true

  while (running) {
    await showMenu()
    const choice = await question('Enter your choice (1-6): ')

    switch (choice.trim()) {
      case '1':
        await startContainer()
        break
      case '2':
        await addMigrations()
        break
      case '3':
        await restartContainer()
        break
      case '4':
        await stopContainer()
        break
      case '5':
        await exportDatabase()
        break
      case '6':
        console.log('\n👋 Goodbye!\n')
        running = false
        break
      default:
        console.log('\n❌ Invalid choice. Please try again.')
        await question('\nPress Enter to continue...')
    }
  }

  rl.close()
  process.exit(0)
}

main()
