module.exports = {
  // Entorno de prueba
  testEnvironment: 'node',

  // Patrón para detectar archivos de prueba
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Excluir el archivo de inicio del servidor
    '!src/config/**', // Excluir configuraciones
    '!**/node_modules/**'
  ],

  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Directorio de reportes de cobertura
  coverageDirectory: 'coverage',

  // Reporteros de cobertura
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Timeout para pruebas (en milisegundos)
  testTimeout: 10000,

  // Limpiar mocks automáticamente entre tests
  clearMocks: true,

  // Restaurar mocks automáticamente entre tests
  restoreMocks: true,

  // Verbose output
  verbose: true
};
