const Departamento = require('../models/Departamento');
const { validationResult } = require('express-validator');

class DepartamentoController {
  // GET - Obtener todos los departamentos con paginación
  static async getAll(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';

      const result = await Departamento.findAll(page, limit, search);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener departamentos',
        message: error.message 
      });
    }
  }

  // GET - Obtener departamento por ID
  static async getById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const departamento = await Departamento.findById(req.params.id);
      
      if (!departamento) {
        return res.status(404).json({ 
          success: false,
          error: 'Departamento no encontrado' 
        });
      }

      // Obtener cantidad de usuarios en el departamento
      const usersCount = await Departamento.getUsersCount(req.params.id);
      
      res.json({
        success: true,
        data: {
          ...departamento,
          usuarios_count: usersCount
        }
      });
    } catch (error) {
      console.error('Error al obtener departamento:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener departamento',
        message: error.message 
      });
    }
  }

  // POST - Crear nuevo departamento
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar si el nombre ya existe
      const existingDepartamento = await Departamento.findByNombre(req.body.nombre);
      if (existingDepartamento) {
        return res.status(400).json({ 
          success: false,
          error: 'El nombre del departamento ya está en uso' 
        });
      }

      const nuevoDepartamento = await Departamento.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Departamento creado exitosamente',
        data: nuevoDepartamento
      });
    } catch (error) {
      console.error('Error al crear departamento:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al crear departamento',
        message: error.message 
      });
    }
  }

  // PUT - Actualizar departamento
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar si el departamento existe
      const departamentoExistente = await Departamento.findById(req.params.id);
      if (!departamentoExistente) {
        return res.status(404).json({ 
          success: false,
          error: 'Departamento no encontrado' 
        });
      }

      // Si se actualiza el nombre, verificar que no esté en uso
      if (req.body.nombre && req.body.nombre !== departamentoExistente.nombre) {
        const existingDepartamento = await Departamento.findByNombre(req.body.nombre);
        if (existingDepartamento) {
          return res.status(400).json({ 
            success: false,
            error: 'El nombre del departamento ya está en uso' 
          });
        }
      }

      const departamentoActualizado = await Departamento.update(req.params.id, req.body);
      
      res.json({
        success: true,
        message: 'Departamento actualizado exitosamente',
        data: departamentoActualizado
      });
    } catch (error) {
      console.error('Error al actualizar departamento:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al actualizar departamento',
        message: error.message 
      });
    }
  }

  // DELETE - Eliminar departamento
  static async delete(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar si hay usuarios asociados
      const usersCount = await Departamento.getUsersCount(req.params.id);
      if (usersCount > 0) {
        return res.status(400).json({ 
          success: false,
          error: 'No se puede eliminar el departamento porque tiene usuarios asociados',
          usuarios_count: usersCount
        });
      }

      const departamentoEliminado = await Departamento.delete(req.params.id);
      
      if (!departamentoEliminado) {
        return res.status(404).json({ 
          success: false,
          error: 'Departamento no encontrado' 
        });
      }

      res.json({
        success: true,
        message: 'Departamento eliminado exitosamente',
        data: departamentoEliminado
      });
    } catch (error) {
      console.error('Error al eliminar departamento:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al eliminar departamento',
        message: error.message 
      });
    }
  }

  // GET - Buscar departamentos
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

      const result = await Departamento.search(searchTerm, page, limit);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error al buscar departamentos:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al buscar departamentos',
        message: error.message 
      });
    }
  }
}

module.exports = DepartamentoController;
