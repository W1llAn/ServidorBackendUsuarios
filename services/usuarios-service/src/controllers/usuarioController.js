const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

class UsuarioController {
  // GET - Obtener todos los usuarios con paginación
  static async getAll(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';

      const result = await Usuario.findAll(page, limit, search);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener usuarios',
        message: error.message 
      });
    }
  }

  // GET - Obtener usuario por ID
  static async getById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const usuario = await Usuario.findById(req.params.id);
      
      if (!usuario) {
        return res.status(404).json({ 
          success: false,
          error: 'Usuario no encontrado' 
        });
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener usuario',
        message: error.message 
      });
    }
  }

  // POST - Crear nuevo usuario
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar si el username ya existe
      const existingUser = await Usuario.findByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'El username ya está en uso' 
        });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      
      const userData = {
        ...req.body,
        password: hashedPassword
      };

      const nuevoUsuario = await Usuario.create(userData);
      
      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: nuevoUsuario
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al crear usuario',
        message: error.message 
      });
    }
  }

  // PUT - Actualizar usuario
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar si el usuario existe
      const usuarioExistente = await Usuario.findById(req.params.id);
      if (!usuarioExistente) {
        return res.status(404).json({ 
          success: false,
          error: 'Usuario no encontrado' 
        });
      }

      // Si se actualiza el username, verificar que no esté en uso
      if (req.body.username && req.body.username !== usuarioExistente.username) {
        const existingUser = await Usuario.findByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).json({ 
            success: false,
            error: 'El username ya está en uso' 
          });
        }
      }

      const userData = { ...req.body };
      
      // Si se actualiza la contraseña, hashearla
      if (req.body.password) {
        userData.password = await bcrypt.hash(req.body.password, 10);
      }

      const usuarioActualizado = await Usuario.update(req.params.id, userData);
      
      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuarioActualizado
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al actualizar usuario',
        message: error.message 
      });
    }
  }

  // DELETE - Eliminar usuario
  static async delete(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const usuarioEliminado = await Usuario.delete(req.params.id);
      
      if (!usuarioEliminado) {
        return res.status(404).json({ 
          success: false,
          error: 'Usuario no encontrado' 
        });
      }

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
        data: usuarioEliminado
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al eliminar usuario',
        message: error.message 
      });
    }
  }

  // GET - Buscar usuarios
  static async search(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const searchTerm = req.query.q || '';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!searchTerm) {
        return res.status(400).json({ 
          success: false,
          error: 'El parámetro de búsqueda (q) es requerido' 
        });
      }

      const result = await Usuario.search(searchTerm, page, limit);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al buscar usuarios',
        message: error.message 
      });
    }
  }
}

module.exports = UsuarioController;
