-- Migration: 20260612_150000_create_espacios_table
-- Description: Create espacios table for storage spaces
-- Rollback: DROP TABLE IF EXISTS espacios;

CREATE TABLE IF NOT EXISTS espacios (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  ubicacion VARCHAR(255),
  capacidad_m2 DECIMAL(10, 2),
  precio_mensual DECIMAL(10, 2),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO espacios (usuario_id, nombre, descripcion, ubicacion, capacidad_m2, precio_mensual, activo) VALUES
  (1, 'Almacén Centro', 'Almacén céntrico con acceso fácil', 'Centro Madrid', 500.00, 2500.00, TRUE),
  (1, 'Bodega Periférica', 'Bodega en zona periférica', 'Periferia Madrid', 1000.00, 3500.00, TRUE),
  (2, 'Mini Storage', 'Espacio pequeño para particulares', 'Zona Norte', 50.00, 150.00, TRUE)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_espacios_usuario_id ON espacios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_espacios_activo ON espacios(activo);

-- Record migration execution
INSERT INTO migrations_log (migration_name) VALUES ('20260612_150000_create_espacios_table')
ON CONFLICT DO NOTHING;
