const express = require('express');
const router = express.Router();
const DepartamentoController = require('../controllers/departamentoController');
const departamentoValidationRules = require('../validators/departamentoValidator');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// GET - Obtener todos los departamentos con paginación y búsqueda
router.get('/', 
  departamentoValidationRules.pagination,
  DepartamentoController.getAll
);

// GET - Buscar departamentos
router.get('/search', 
  departamentoValidationRules.pagination,
  DepartamentoController.search
);

// GET - Obtener departamento por ID
router.get('/:id', 
  departamentoValidationRules.getById,
  DepartamentoController.getById
);

// POST - Crear nuevo departamento (solo admin)
router.post('/', 
  verifyToken,
  isAdmin,
  departamentoValidationRules.create,
  DepartamentoController.create
);

// PUT - Actualizar departamento (solo admin)
router.put('/:id', 
  verifyToken,
  isAdmin,
  departamentoValidationRules.update,
  DepartamentoController.update
);

// DELETE - Eliminar departamento
router.delete('/:id', 
  departamentoValidationRules.delete,
  DepartamentoController.delete
);

module.exports = router;
