const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authValidationRules = require('../validators/authValidator');
const { verifyToken } = require('../middlewares/authMiddleware');

// POST - Registrar nuevo usuario
router.post('/register',
  authValidationRules.register,
  AuthController.register
);

// POST - Login
router.post('/login',
  authValidationRules.login,
  AuthController.login
);

// POST - Refresh token
router.post('/refresh',
  authValidationRules.refreshToken,
  AuthController.refreshToken
);

// POST - Logout
router.post('/logout',
  AuthController.logout
);

// GET - Obtener perfil (requiere autenticación)
router.get('/profile',
  verifyToken,
  AuthController.getProfile
);

// PUT - Cambiar contraseña (requiere autenticación)
router.put('/change-password',
  verifyToken,
  authValidationRules.changePassword,
  AuthController.changePassword
);

// POST - Verificar token
router.post('/verify',
  verifyToken,
  AuthController.verifyToken
);

module.exports = router;
