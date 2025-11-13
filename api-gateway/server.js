require('dotenv').config();
const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Gateway funcionando correctamente' });
});

// Proxy para el servicio de autenticación
app.use('/api/auth', proxy(process.env.AUTH_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    return '/api/auth' + req.url;
  },
  timeout: 30000,
  proxyErrorHandler: (err, res, next) => {
    console.error('[AUTH PROXY] Error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({ 
        error: 'Servicio de autenticación no disponible',
        message: err.message 
      });
    }
  }
}));

// Proxy para el servicio de usuarios
app.use('/api/usuarios', proxy(process.env.USERS_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    return '/api/usuarios' + req.url;
  },
  timeout: 30000,
  proxyErrorHandler: (err, res, next) => {
    console.error('[USUARIOS PROXY] Error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({ 
        error: 'Servicio de usuarios no disponible',
        message: err.message 
      });
    }
  }
}));

// Proxy para el servicio de departamentos
app.use('/api/departamentos', proxy(process.env.DEPARTMENTS_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    return '/api/departamentos' + req.url;
  },
  timeout: 30000,
  proxyErrorHandler: (err, res, next) => {
    console.error('[DEPARTAMENTOS PROXY] Error:', err.message);
    if (!res.headersSent) {
      res.status(503).json({ 
        error: 'Servicio de departamentos no disponible',
        message: err.message 
      });
    }
  }
}));

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`API Gateway corriendo en puerto ${PORT}`);
  console.log(`Auth Service: ${process.env.AUTH_SERVICE_URL}`);
  console.log(`Usuarios Service: ${process.env.USERS_SERVICE_URL}`);
  console.log(`Departamentos Service: ${process.env.DEPARTMENTS_SERVICE_URL}`);
});
