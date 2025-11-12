const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

class AuthController {
  // POST - Registrar nuevo usuario
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password, rol, id_departamento } = req.body;

      // Verificar si el username ya existe
      const existingUser = await pool.query(
        'SELECT * FROM usuarios WHERE username = $1',
        [username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'El username ya está en uso'
        });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario
      const query = `
        INSERT INTO usuarios (username, password, rol, id_departamento)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, rol, id_departamento, created_at
      `;
      const values = [username, hashedPassword, rol, id_departamento || null];
      const result = await pool.query(query, values);

      const newUser = result.rows[0];

      // Generar tokens
      const accessToken = jwt.sign(
        { id: newUser.id, username: newUser.username, rol: newUser.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { id: newUser.id, username: newUser.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      // Guardar refresh token en la BD
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
        [newUser.id, refreshToken]
      );

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            rol: newUser.rol,
            id_departamento: newUser.id_departamento
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        error: 'Error al registrar usuario',
        message: error.message
      });
    }
  }

  // POST - Login
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Buscar usuario
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      const user = result.rows[0];

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      // Generar tokens
      const accessToken = jwt.sign(
        { id: user.id, username: user.username, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      // Guardar refresh token en la BD
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
        [user.id, refreshToken]
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            username: user.username,
            rol: user.rol,
            id_departamento: user.id_departamento
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        error: 'Error al iniciar sesión',
        message: error.message
      });
    }
  }

  // POST - Refresh token
  static async refreshToken(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { refreshToken } = req.body;

      // Verificar que el token existe en la BD
      const tokenResult = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token inválido'
        });
      }

      // Verificar que el token sea válido
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch (error) {
        // Si el token expiró, eliminarlo de la BD
        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
        return res.status(401).json({
          success: false,
          error: 'Refresh token expirado'
        });
      }

      // Obtener información actualizada del usuario
      const userResult = await pool.query(
        'SELECT id, username, rol FROM usuarios WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const user = userResult.rows[0];

      // Generar nuevo access token
      const newAccessToken = jwt.sign(
        { id: user.id, username: user.username, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error) {
      console.error('Error al refrescar token:', error);
      res.status(500).json({
        success: false,
        error: 'Error al refrescar token',
        message: error.message
      });
    }
  }

  // POST - Logout
  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Eliminar refresh token de la BD
        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
      }

      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cerrar sesión',
        message: error.message
      });
    }
  }

  // GET - Obtener perfil del usuario autenticado
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const query = `
        SELECT u.id, u.username, u.rol, u.id_departamento,
               d.nombre as departamento_nombre, u.created_at
        FROM usuarios u
        LEFT JOIN departamentos d ON u.id_departamento = d.id
        WHERE u.id = $1
      `;
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener perfil',
        message: error.message
      });
    }
  }

  // PUT - Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Obtener usuario
      const userResult = await pool.query(
        'SELECT password FROM usuarios WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const user = userResult.rows[0];

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Contraseña actual incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await pool.query(
        'UPDATE usuarios SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );

      // Invalidar todos los refresh tokens del usuario
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente. Por favor, inicia sesión nuevamente.'
      });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cambiar contraseña',
        message: error.message
      });
    }
  }

  // POST - Verificar token
  static async verifyToken(req, res) {
    try {
      // Si llegamos aquí, el token es válido (verificado por el middleware)
      res.json({
        success: true,
        data: {
          user: req.user,
          valid: true
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al verificar token',
        message: error.message
      });
    }
  }
}

module.exports = AuthController;
