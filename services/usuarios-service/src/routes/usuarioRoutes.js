const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');
const usuarioValidationRules = require('../validators/usuarioValidator');

// GET - Obtener todos los usuarios con paginación y búsqueda
router.get('/', 
  usuarioValidationRules.pagination,
  UsuarioController.getAll
);

// GET - Buscar usuarios
router.get('/search', 
  usuarioValidationRules.pagination,
  UsuarioController.search
);

// GET - Obtener usuario por ID
router.get('/:id', 
  usuarioValidationRules.getById,
  UsuarioController.getById
);

// POST - Crear nuevo usuario
router.post('/', 
  usuarioValidationRules.create,
  UsuarioController.create
);

// PUT - Actualizar usuario
router.put('/:id', 
  usuarioValidationRules.update,
  UsuarioController.update
);

// DELETE - Eliminar usuario
router.delete('/:id', 
  usuarioValidationRules.delete,
  UsuarioController.delete
);

module.exports = router;
