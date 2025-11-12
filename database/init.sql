-- Script de creación de base de datos y tablas para microservicios

-- Crear base de datos
CREATE DATABASE microservicios_db;

-- Conectar a la base de datos
\c microservicios_db;

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

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_id_departamento ON usuarios(id_departamento);
CREATE INDEX idx_departamentos_nombre ON departamentos(nombre);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departamentos_updated_at BEFORE UPDATE ON departamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo para departamentos
INSERT INTO departamentos (nombre, descripcion) VALUES
('Recursos Humanos', 'Departamento encargado de la gestión del personal'),
('Tecnología', 'Departamento de desarrollo y sistemas'),
('Ventas', 'Departamento de ventas y atención al cliente'),
('Finanzas', 'Departamento de contabilidad y finanzas'),
('Marketing', 'Departamento de marketing y publicidad');

-- Crear tabla refresh_tokens para manejo de tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 days'
);

-- Crear índice para refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Insertar datos de ejemplo para usuarios (password es "123456" hasheado con bcrypt)
-- Nota: En producción, las contraseñas deben ser hasheadas desde la aplicación
INSERT INTO usuarios (username, password, rol, id_departamento) VALUES
('admin', '$2a$12$x8rHiSBpuRwngjCcaaxmeuoONecpE.uGMx8zmiVtBQO9XWgpwSetC', 'admin', 2),
('juan.perez', '$2a$12$x8rHiSBpuRwngjCcaaxmeuoONecpE.uGMx8zmiVtBQO9XWgpwSetC', 'usuario', 1),
('maria.garcia', '$2a$12$x8rHiSBpuRwngjCcaaxmeuoONecpE.uGMx8zmiVtBQO9XWgpwSetC', 'supervisor', 3),
('carlos.lopez', '$2a$12$x8rHiSBpuRwngjCcaaxmeuoONecpE.uGMx8zmiVtBQO9XWgpwSetC', 'usuario', 2);

-- Verificar creación
SELECT 'Tablas creadas exitosamente' AS mensaje;
SELECT COUNT(*) AS total_departamentos FROM departamentos;
SELECT COUNT(*) AS total_usuarios FROM usuarios;
