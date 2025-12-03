const request = require('supertest');
const bcrypt = require('bcryptjs');

// Mock del pool de base de datos ANTES de importar el servidor
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

const app = require('../../src/server');
const pool = require('../../src/config/database');

describe('Usuarios API - Pruebas de Integración', () => {
  // Limpiar todos los mocks después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/usuarios', () => {
    test('debería retornar lista de usuarios con status 200', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: 'usuario1', rol: 'admin', id_departamento: 1, departamento_nombre: 'TI' },
        { id: 2, username: 'usuario2', rol: 'usuario', id_departamento: 2, departamento_nombre: 'Ventas' }
      ];
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });

      // Act
      const response = await request(app)
        .get('/api/usuarios')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    test('debería retornar usuarios con paginación correcta', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: 'usuario1', rol: 'admin', id_departamento: 1, departamento_nombre: 'TI' }
      ];
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers })
        .mockResolvedValueOnce({ rows: [{ count: '15' }] });

      // Act
      const response = await request(app)
        .get('/api/usuarios?page=2&limit=5')
        .expect(200);

      // Assert
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.totalPages).toBe(3);
    });

    test('debería filtrar usuarios por término de búsqueda', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: 'admin', rol: 'admin', id_departamento: 1, departamento_nombre: 'TI' }
      ];
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      // Act
      const response = await request(app)
        .get('/api/usuarios?search=admin')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].username).toBe('admin');
    });

    test('debería retornar error 500 si hay problema en base de datos', async () => {
      // Arrange
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Act
      const response = await request(app)
        .get('/api/usuarios')
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/usuarios/:id', () => {
    test('debería retornar un usuario por ID con status 200', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'usuario1',
        rol: 'admin',
        id_departamento: 1,
        departamento_nombre: 'TI'
      };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Act
      const response = await request(app)
        .get('/api/usuarios/1')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUser);
      expect(response.body.data.id).toBe(1);
    });

    test('debería retornar 404 si el usuario no existe', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      const response = await request(app)
        .get('/api/usuarios/999')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Usuario no encontrado');
    });

    test('debería retornar 400 si el ID no es válido', async () => {
      // Act
      const response = await request(app)
        .get('/api/usuarios/invalid')
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/usuarios', () => {
    test('debería crear un nuevo usuario con status 201', async () => {
      // Arrange
      const newUser = {
        username: 'nuevousuario',
        password: 'Password123!',
        rol: 'usuario',
        id_departamento: 1
      };
      const mockCreatedUser = {
        id: 1,
        username: 'nuevousuario',
        rol: 'usuario',
        id_departamento: 1
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // findByUsername - no existe
        .mockResolvedValueOnce({ rows: [mockCreatedUser] }); // create

      // Act
      const response = await request(app)
        .post('/api/usuarios')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuario creado exitosamente');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.username).toBe('nuevousuario');
      expect(response.body.data).not.toHaveProperty('password'); // No debe retornar password
    });

    test('debería retornar 400 si el username ya existe', async () => {
      // Arrange
      const newUser = {
        username: 'existente',
        password: 'Password123!',
        rol: 'usuario',
        id_departamento: 1
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, username: 'existente', password: 'hash' }] 
      }); // findByUsername - existe

      // Act
      const response = await request(app)
        .post('/api/usuarios')
        .send(newUser)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('El username ya está en uso');
    });

    test('debería retornar 400 si faltan campos requeridos', async () => {
      // Arrange
      const invalidUser = {
        username: 'test'
        // Faltan password, rol, id_departamento
      };

      // Act
      const response = await request(app)
        .post('/api/usuarios')
        .send(invalidUser)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('debería retornar 400 si el username es demasiado corto', async () => {
      // Arrange
      const invalidUser = {
        username: 'ab', // Muy corto
        password: 'password123',
        rol: 'usuario',
        id_departamento: 1
      };

      // Act
      const response = await request(app)
        .post('/api/usuarios')
        .send(invalidUser)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('errors');
    });

    test('debería retornar 400 si el rol no es válido', async () => {
      // Arrange
      const invalidUser = {
        username: 'testuser',
        password: 'password123',
        rol: 'invalid_rol', // Rol inválido
        id_departamento: 1
      };

      // Act
      const response = await request(app)
        .post('/api/usuarios')
        .send(invalidUser)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    test('debería actualizar un usuario existente con status 200', async () => {
      // Arrange
      const updateData = {
        username: 'usuarioactualizado',
        rol: 'admin'
      };
      const existingUser = {
        id: 1,
        username: 'usuariooriginal',
        rol: 'usuario',
        id_departamento: 1
      };
      const updatedUser = {
        id: 1,
        username: 'usuarioactualizado',
        rol: 'admin',
        id_departamento: 1
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [existingUser] }) // findById
        .mockResolvedValueOnce({ rows: [] }) // findByUsername - no está en uso
        .mockResolvedValueOnce({ rows: [updatedUser] }); // update

      // Act
      const response = await request(app)
        .put('/api/usuarios/1')
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuario actualizado exitosamente');
      expect(response.body.data.username).toBe('usuarioactualizado');
      expect(response.body.data.rol).toBe('admin');
    });

    test('debería retornar 404 si el usuario no existe', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rows: [] }); // findById - no existe

      // Act
      const response = await request(app)
        .put('/api/usuarios/999')
        .send({ username: 'testuser', rol: 'usuario' })
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Usuario no encontrado');
    });

    test('debería retornar 400 si el nuevo username ya está en uso', async () => {
      // Arrange
      const existingUser = {
        id: 1,
        username: 'usuario1',
        rol: 'usuario',
        id_departamento: 1
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [existingUser] }) // findById
        .mockResolvedValueOnce({ rows: [{ id: 2, username: 'usuarioexistente', password: 'hash' }] }); // findByUsername - está en uso

      // Act
      const response = await request(app)
        .put('/api/usuarios/1')
        .send({ username: 'usuarioexistente', rol: 'usuario' })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('El username ya está en uso');
    });

    test('debería actualizar solo los campos proporcionados', async () => {
      // Arrange
      const existingUser = {
        id: 1,
        username: 'usuario1',
        rol: 'usuario',
        id_departamento: 1
      };
      const updatedUser = {
        id: 1,
        username: 'usuario1',
        rol: 'admin',
        id_departamento: 1
      };
      
      pool.query
        .mockResolvedValueOnce({ rows: [existingUser] }) // findById
        .mockResolvedValueOnce({ rows: [updatedUser] }); // update

      // Act
      const response = await request(app)
        .put('/api/usuarios/1')
        .send({ rol: 'admin', username: 'usuario1' }) // Incluir username para pasar validación
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.rol).toBe('admin');
      expect(response.body.data.username).toBe('usuario1'); // Debe mantener el username original
    });
  });

  describe('DELETE /api/usuarios/:id', () => {
    test('debería eliminar un usuario existente con status 200', async () => {
      // Arrange
      const deletedUser = {
        id: 1,
        username: 'usuariooriginal',
        rol: 'usuario',
        id_departamento: 1
      };
      pool.query.mockResolvedValueOnce({ rows: [deletedUser] });

      // Act
      const response = await request(app)
        .delete('/api/usuarios/1')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuario eliminado exitosamente');
      expect(response.body.data).toEqual(deletedUser);
    });

    test('debería retornar 404 si el usuario no existe', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rows: [] }); // delete retorna array vacío

      // Act
      const response = await request(app)
        .delete('/api/usuarios/999')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Usuario no encontrado');
    });

    test('debería retornar 400 si el ID no es válido', async () => {
      // Act
      const response = await request(app)
        .delete('/api/usuarios/invalid')
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/usuarios/search', () => {
    test('debería buscar usuarios por término y retornar resultados', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: 'admin1', rol: 'admin', id_departamento: 1, departamento_nombre: 'TI' },
        { id: 2, username: 'admin2', rol: 'admin', id_departamento: 2, departamento_nombre: 'RRHH' }
      ];
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers }) // Primera query: datos
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Segunda query: count

      // Act
      const response = await request(app)
        .get('/api/usuarios/search?q=admin')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.total).toBe(2);
    });

    test('debería retornar 400 si falta el parámetro de búsqueda', async () => {
      // Act
      const response = await request(app)
        .get('/api/usuarios/search')
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('El parámetro de búsqueda (q) es requerido');
    });

    test('debería retornar array vacío si no hay resultados', async () => {
      // Arrange
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Primera query: datos
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // Segunda query: count

      // Act
      const response = await request(app)
        .get('/api/usuarios/search?q=noexiste')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('Health Check', () => {
    test('debería retornar status OK en /health', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'Usuarios Service');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Rutas no encontradas', () => {
    test('debería retornar 404 para rutas no definidas', async () => {
      // Act
      const response = await request(app)
        .get('/api/ruta-inexistente')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ruta no encontrada');
    });
  });
});
