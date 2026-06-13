-- Migration: 20260612_120000_create_usuarios_table
-- Description: Create usuarios table with initial test data
-- Rollback: DROP TABLE IF EXISTS migrations_log; DROP TABLE IF EXISTS usuarios;

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS migrations_log (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create usuarios table
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO usuarios (nombre, email, password_hash, telefono) VALUES
  ('Diego Prueba', 'diego@example.com', '$2a$10$YourHashedPasswordHere1', '+34 123 456 789'),
  ('Carlos Test', 'carlos@example.com', '$2a$10$YourHashedPasswordHere2', '+34 987 654 321'),
  ('María García', 'maria@example.com', '$2a$10$YourHashedPasswordHere3', '+34 555 666 777')
ON CONFLICT (email) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Record migration execution
INSERT INTO migrations_log (migration_name) VALUES ('20260612_120000_create_usuarios_table')
ON CONFLICT DO NOTHING;
