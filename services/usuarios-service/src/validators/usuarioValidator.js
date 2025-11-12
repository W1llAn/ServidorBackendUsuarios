const { body, param, query } = require('express-validator');

const usuarioValidationRules = {
  create: [
    body('username')
      .notEmpty().withMessage('El username es requerido')
      .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres')
      .trim()
      .escape(),
    body('password')
      .notEmpty().withMessage('La contraseña es requerida')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol')
      .notEmpty().withMessage('El rol es requerido')
      .isIn(['admin', 'usuario', 'supervisor']).withMessage('El rol debe ser: admin, usuario o supervisor'),
    body('id_departamento')
      .optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('El id_departamento debe ser un número entero positivo')
  ],

  update: [
    param('id')
      .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres')
      .trim()
      .escape(),
    body('password')
      .optional()
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol')
      .optional()
      .isIn(['admin', 'usuario', 'supervisor']).withMessage('El rol debe ser: admin, usuario o supervisor'),
    body('id_departamento')
      .optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('El id_departamento debe ser un número entero positivo')
  ],

  getById: [
    param('id')
      .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
  ],

  delete: [
    param('id')
      .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
  ],

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
    query('search')
      .optional()
      .trim()
      .escape()
  ]
};

module.exports = usuarioValidationRules;
