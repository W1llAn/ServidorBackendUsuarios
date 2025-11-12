const { body } = require('express-validator');

const authValidationRules = {
  register: [
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

  login: [
    body('username')
      .notEmpty().withMessage('El username es requerido')
      .trim()
      .escape(),
    body('password')
      .notEmpty().withMessage('La contraseña es requerida')
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty().withMessage('El refresh token es requerido')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword')
      .notEmpty().withMessage('La nueva contraseña es requerida')
      .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
  ]
};

module.exports = authValidationRules;
