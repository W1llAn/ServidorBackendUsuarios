-- Migración para agregar soporte de OAuth 2.0
-- Ejecutar después de init.sql

-- Tabla para almacenar cuentas OAuth vinculadas a usuarios
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'github', etc.
    provider_user_id VARCHAR(255) NOT NULL, -- ID del usuario en el proveedor
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    profile_photo TEXT,
    access_token TEXT,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id) -- Un usuario no puede vincular la misma cuenta OAuth dos veces
);

-- Modificar tabla usuarios para soportar autenticación OAuth
-- Hacer el password opcional para usuarios que solo usan OAuth
ALTER TABLE usuarios ALTER COLUMN password DROP NOT NULL;

-- Agregar columna para identificar el tipo de autenticación
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) DEFAULT 'local' 
    CHECK (auth_type IN ('local', 'oauth', 'hybrid'));

-- Agregar columna para email (útil para OAuth)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_email ON oauth_accounts(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Trigger para actualizar updated_at en oauth_accounts
DROP TRIGGER IF EXISTS update_oauth_accounts_updated_at ON oauth_accounts;
CREATE TRIGGER update_oauth_accounts_updated_at BEFORE UPDATE ON oauth_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE oauth_accounts IS 'Almacena las cuentas OAuth vinculadas a usuarios del sistema';
COMMENT ON COLUMN oauth_accounts.provider IS 'Proveedor OAuth: google, github, etc.';
COMMENT ON COLUMN oauth_accounts.provider_user_id IS 'ID único del usuario en el proveedor OAuth';
COMMENT ON COLUMN usuarios.auth_type IS 'Tipo de autenticación: local (password), oauth (solo OAuth), hybrid (ambos)';
