-- Script de inicialización de base de datos para microservicios
-- Este script se ejecuta automáticamente al crear el contenedor de PostgreSQL

-- Crear tabla departamentos
CREATE TABLE IF NOT EXISTS departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'usuario', 'supervisor')),
    id_departamento INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla refresh_tokens para manejo de tokens JWT
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 days'
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_id_departamento ON usuarios(id_departamento);
CREATE INDEX IF NOT EXISTS idx_departamentos_nombre ON departamentos(nombre);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departamentos_updated_at ON departamentos;
CREATE TRIGGER update_departamentos_updated_at BEFORE UPDATE ON departamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo para departamentos
INSERT INTO departamentos (nombre, descripcion) VALUES
('Recursos Humanos', 'Departamento encargado de la gestión del personal'),
('Tecnología', 'Departamento de desarrollo y sistemas'),
('Ventas', 'Departamento de ventas y atención al cliente'),
('Finanzas', 'Departamento de contabilidad y finanzas'),
('Marketing', 'Departamento de marketing y publicidad')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar datos de ejemplo para usuarios
-- Password: "123456" hasheado con bcrypt (10 rounds)
-- Hash generado con: bcrypt.hash('123456', 10)
INSERT INTO usuarios (username, password, rol, id_departamento) VALUES
('admin', '$2a$10$A321LfwxLML12Bfo0DoyWe9cKw2gR1QSNDPJbw55MjmyBaepe1/yC', 'admin', 2),
('juan.perez', '$2a$10$A321LfwxLML12Bfo0DoyWe9cKw2gR1QSNDPJbw55MjmyBaepe1/yC', 'usuario', 1),
('maria.garcia', '$2a$10$A321LfwxLML12Bfo0DoyWe9cKw2gR1QSNDPJbw55MjmyBaepe1/yC', 'supervisor', 3),
('carlos.lopez', '$2a$10$A321LfwxLML12Bfo0DoyWe9cKw2gR1QSNDPJbw55MjmyBaepe1/yC', 'usuario', 2)
ON CONFLICT (username) DO NOTHING;
