const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = {
  // Verificar que el token sea válido
  verifyToken: (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token no proporcionado'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, username, rol }
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expirado'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
  },

  // Verificar que el usuario tenga rol de admin
  isAdmin: (req, res, next) => {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Se requiere rol de administrador'
      });
    }
    next();
  }
};

module.exports = authMiddleware;
