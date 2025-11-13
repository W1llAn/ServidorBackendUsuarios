-- Script para agregar solo la tabla de refresh_tokens
-- Ejecutar esto si ya tienes las otras tablas creadas

-- Crear tabla refresh_tokens para manejo de tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 days'
);

-- Crear índices para refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Verificar
SELECT 'Tabla refresh_tokens creada exitosamente' AS mensaje;
SELECT COUNT(*) AS total_refresh_tokens FROM refresh_tokens;
