require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Gateway funcionando correctamente' });
});

// Proxy para el servicio de autenticación
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    res.status(503).json({ 
      error: 'Servicio de autenticación no disponible',
      message: err.message 
    });
  }
}));

// Proxy para el servicio de usuarios
app.use('/api/usuarios', createProxyMiddleware({
  target: process.env.USERS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/usuarios': '/api/usuarios'
  },
  onError: (err, req, res) => {
    res.status(503).json({ 
      error: 'Servicio de usuarios no disponible',
      message: err.message 
    });
  }
}));

// Proxy para el servicio de departamentos
app.use('/api/departamentos', createProxyMiddleware({
  target: process.env.DEPARTMENTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/departamentos': '/api/departamentos'
  },
  onError: (err, req, res) => {
    res.status(503).json({ 
      error: 'Servicio de departamentos no disponible',
      message: err.message 
    });
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
