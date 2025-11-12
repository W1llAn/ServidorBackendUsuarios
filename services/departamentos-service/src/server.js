require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const departamentoRoutes = require('./routes/departamentoRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Departamentos Service',
    timestamp: new Date().toISOString()
  });
});

// Rutas
app.use('/api/departamentos', departamentoRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada' 
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Error interno del servidor',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`Servicio de Departamentos corriendo en puerto ${PORT}`);
});

module.exports = app;
