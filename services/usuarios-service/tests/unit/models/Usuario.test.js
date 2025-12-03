const Usuario = require('../../../src/models/Usuario');
const pool = require('../../../src/config/database');

// Mock del pool de base de datos
jest.mock('../../../src/config/database');

describe('Usuario Model - Pruebas Unitarias', () => {
  // Limpiar todos los mocks después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    test('debería retornar una lista paginada de usuarios', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: 'usuario1', rol: 'admin', id_departamento: 1, departamento_nombre: 'TI' },
        { id: 2, username: 'usuario2', rol: 'user', id_departamento: 2, departamento_nombre: 'Ventas' }
      ];
      const mockCount = { rows: [{ count: '2' }] };
      
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers }) // Primera llamada: datos
        .mockResolvedValueOnce(mockCount); // Segunda llamada: count

      // Act
      const result = await Usuario.findAll(1, 10, '');

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    test('debería filtrar usuarios por término de búsqueda', async () => {
      // Arrange
      const searchTerm = 'admin';
      const mockUsers = [
        { id: 1, username: 'admin1', rol: 'admin', id_departamento: 1, departamento_nombre: 'TI' }
      ];
      const mockCount = { rows: [{ count: '1' }] };
      
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers })
        .mockResolvedValueOnce(mockCount);

      // Act
      const result = await Usuario.findAll(1, 10, searchTerm);

      // Assert
      expect(result.data).toEqual(mockUsers);
      expect(result.pagination.total).toBe(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining([`%${searchTerm}%`])
      );
    });

    test('debería manejar páginas vacías correctamente', async () => {
      // Arrange
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      // Act
      const result = await Usuario.findAll(1, 10, '');

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('findById', () => {
    test('debería retornar un usuario por su ID', async () => {
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
      const result = await Usuario.findById(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE u.id = $1'),
        [1]
      );
    });

    test('debería retornar undefined si el usuario no existe', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      const result = await Usuario.findById(999);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('findByUsername', () => {
    test('debería retornar un usuario por su username', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'usuario1',
        password: 'hashedpassword',
        rol: 'admin',
        id_departamento: 1
      };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Act
      const result = await Usuario.findByUsername('usuario1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM usuarios WHERE username = $1',
        ['usuario1']
      );
    });

    test('debería retornar undefined si el username no existe', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      const result = await Usuario.findByUsername('noexiste');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    test('debería crear un nuevo usuario correctamente', async () => {
      // Arrange
      const userData = {
        username: 'nuevousuario',
        password: 'hashedpassword',
        rol: 'user',
        id_departamento: 1
      };
      const mockCreatedUser = {
        id: 1,
        username: 'nuevousuario',
        rol: 'user',
        id_departamento: 1
      };
      pool.query.mockResolvedValueOnce({ rows: [mockCreatedUser] });

      // Act
      const result = await Usuario.create(userData);

      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usuarios'),
        [userData.username, userData.password, userData.rol, userData.id_departamento]
      );
    });

    test('debería crear un usuario con todos los campos requeridos', async () => {
      // Arrange
      const userData = {
        username: 'admin',
        password: 'securepassword',
        rol: 'admin',
        id_departamento: 2
      };
      const mockCreatedUser = { id: 5, ...userData };
      pool.query.mockResolvedValueOnce({ rows: [mockCreatedUser] });

      // Act
      const result = await Usuario.create(userData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.username).toBe(userData.username);
      expect(result.rol).toBe(userData.rol);
    });
  });

  describe('update', () => {
    test('debería actualizar un usuario correctamente', async () => {
      // Arrange
      const userId = 1;
      const updateData = {
        username: 'usuarioactualizado',
        rol: 'admin'
      };
      const mockUpdatedUser = {
        id: userId,
        username: 'usuarioactualizado',
        rol: 'admin',
        id_departamento: 1
      };
      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedUser] });

      // Act
      const result = await Usuario.update(userId, updateData);

      // Assert
      expect(result).toEqual(mockUpdatedUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios'),
        expect.arrayContaining([...Object.values(updateData), userId])
      );
    });

    test('debería actualizar solo los campos proporcionados', async () => {
      // Arrange
      const userId = 1;
      const updateData = { rol: 'superadmin' };
      const mockUpdatedUser = {
        id: userId,
        username: 'usuario1',
        rol: 'superadmin',
        id_departamento: 1
      };
      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedUser] });

      // Act
      const result = await Usuario.update(userId, updateData);

      // Assert
      expect(result.rol).toBe('superadmin');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('rol = $1'),
        expect.arrayContaining(['superadmin', userId])
      );
    });

    test('debería retornar null si no hay campos para actualizar', async () => {
      // Act
      const result = await Usuario.update(1, {});

      // Assert
      expect(result).toBeNull();
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    test('debería eliminar un usuario correctamente', async () => {
      // Arrange
      const userId = 1;
      const mockDeletedUser = {
        id: userId,
        username: 'usuario1',
        rol: 'user',
        id_departamento: 1
      };
      pool.query.mockResolvedValueOnce({ rows: [mockDeletedUser] });

      // Act
      const result = await Usuario.delete(userId);

      // Assert
      expect(result).toEqual(mockDeletedUser);
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM usuarios WHERE id = $1 RETURNING *',
        [userId]
      );
    });

    test('debería retornar undefined si el usuario no existe', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      const result = await Usuario.delete(999);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('search', () => {
    test('debería buscar usuarios por término de búsqueda', async () => {
      // Arrange
      const searchTerm = 'admin';
      const mockUsers = [
        { id: 1, username: 'admin1', rol: 'admin', id_departamento: 1, departamento_nombre: 'TI' },
        { id: 2, username: 'admin2', rol: 'admin', id_departamento: 2, departamento_nombre: 'RRHH' }
      ];
      const mockCount = { rows: [{ count: '2' }] };
      
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers })
        .mockResolvedValueOnce(mockCount);

      // Act
      const result = await Usuario.search(searchTerm, 1, 10);

      // Assert
      expect(result.data).toEqual(mockUsers);
      expect(result.pagination.total).toBe(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining([`%${searchTerm}%`, 10, 0])
      );
    });

    test('debería retornar resultado vacío si no hay coincidencias', async () => {
      // Arrange
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      // Act
      const result = await Usuario.search('noexiste', 1, 10);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    test('debería manejar paginación en búsqueda', async () => {
      // Arrange
      const mockUsers = [
        { id: 3, username: 'user3', rol: 'user', id_departamento: 1, departamento_nombre: 'TI' }
      ];
      const mockCount = { rows: [{ count: '5' }] };
      
      pool.query
        .mockResolvedValueOnce({ rows: mockUsers })
        .mockResolvedValueOnce(mockCount);

      // Act
      const result = await Usuario.search('user', 2, 2);

      // Assert
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['%user%', 2, 2]) // offset = (2-1) * 2 = 2
      );
    });
  });

  describe('Manejo de errores', () => {
    test('debería propagar errores de base de datos en findAll', async () => {
      // Arrange
      const dbError = new Error('Database connection error');
      pool.query.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(Usuario.findAll()).rejects.toThrow('Database connection error');
    });

    test('debería propagar errores de base de datos en create', async () => {
      // Arrange
      const dbError = new Error('Unique constraint violation');
      pool.query.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(Usuario.create({
        username: 'test',
        password: 'pass',
        rol: 'user',
        id_departamento: 1
      })).rejects.toThrow('Unique constraint violation');
    });
  });
});
