const { body, param, query } = require('express-validator');

const departamentoValidationRules = {
  create: [
    body('nombre')
      .notEmpty().withMessage('El nombre es requerido')
      .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
      .trim()
      .escape(),
    body('descripcion')
      .optional({ nullable: true })
      .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
      .trim()
      .escape()
  ],

  update: [
    param('id')
      .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo'),
    body('nombre')
      .optional()
      .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
      .trim()
      .escape(),
    body('descripcion')
      .optional({ nullable: true })
      .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
      .trim()
      .escape()
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

module.exports = departamentoValidationRules;
