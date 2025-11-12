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
  },

  // Verificar que el usuario tenga rol de admin o supervisor
  isAdminOrSupervisor: (req, res, next) => {
    if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Se requiere rol de administrador o supervisor'
      });
    }
    next();
  },

  // Verificar que el usuario tenga alguno de los roles especificados
  hasRole: (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          error: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`
        });
      }
      next();
    };
  },

  // Verificar que el usuario sea el propietario del recurso o admin
  isOwnerOrAdmin: (req, res, next) => {
    const userId = parseInt(req.params.id);
    if (req.user.rol !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Solo puedes acceder a tu propia información'
      });
    }
    next();
  }
};

module.exports = authMiddleware;
