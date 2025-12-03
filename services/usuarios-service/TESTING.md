# Testing del Servicio de Usuarios

Este documento describe las pruebas implementadas para el microservicio de usuarios.

## 🛠️ Herramientas Utilizadas

- **Jest**: Framework de testing para JavaScript
- **Supertest**: Librería para pruebas de APIs HTTP
- **Mocks**: Simulación de base de datos PostgreSQL

## 📦 Instalación de Dependencias

Antes de ejecutar las pruebas, instala las dependencias:

```bash
cd services/usuarios-service
npm install
```

## 🧪 Tipos de Pruebas Implementadas

### 1. Pruebas Unitarias (`tests/unit/`)

Prueban las funciones individuales del modelo Usuario sin dependencias externas:

- **findAll**: Obtención de usuarios con paginación y búsqueda
- **findById**: Búsqueda de usuario por ID
- **findByUsername**: Búsqueda de usuario por username
- **create**: Creación de nuevos usuarios
- **update**: Actualización de usuarios existentes
- **delete**: Eliminación de usuarios
- **search**: Búsqueda de usuarios por término

### 2. Pruebas de Integración (`tests/integration/`)

Prueban los endpoints completos de la API:

- **GET /api/usuarios**: Listar todos los usuarios
- **GET /api/usuarios/:id**: Obtener usuario por ID
- **POST /api/usuarios**: Crear nuevo usuario
- **PUT /api/usuarios/:id**: Actualizar usuario
- **DELETE /api/usuarios/:id**: Eliminar usuario
- **GET /api/usuarios/search**: Buscar usuarios
- **GET /health**: Health check del servicio

## 🚀 Comandos Disponibles

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas en modo watch (desarrollo)
```bash
npm run test:watch
```

### Ejecutar solo pruebas unitarias
```bash
npm run test:unit
```

### Ejecutar solo pruebas de integración
```bash
npm run test:integration
```

### Generar reporte de cobertura
```bash
npm run test:coverage
```

## 📊 Reporte de Cobertura

Al ejecutar `npm run test:coverage`, se genera un reporte detallado en:

- **Terminal**: Resumen de cobertura
- **HTML**: Carpeta `coverage/` → Abrir `coverage/index.html` en navegador

### Umbrales de Cobertura Configurados

```javascript
{
  branches: 70%,
  functions: 70%,
  lines: 70%,
  statements: 70%
}
```

## 📝 Ejemplos de Salida

### Ejecución exitosa de pruebas:
```
PASS  tests/unit/models/Usuario.test.js
PASS  tests/integration/usuarios.test.js

Test Suites: 2 passed, 2 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        3.567 s
```

### Reporte de cobertura:
```
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------------|---------|----------|---------|---------|-------------------
All files             |   95.23 |    88.46 |   94.44 |   95.12 |                   
 controllers          |   96.87 |    90.00 |   95.00 |   96.77 |                   
  usuarioController.js|   96.87 |    90.00 |   95.00 |   96.77 | 45,78            
 models               |   98.00 |    95.00 |  100.00 |   97.95 |                   
  Usuario.js          |   98.00 |    95.00 |  100.00 |   97.95 | 89               
----------------------|---------|----------|---------|---------|-------------------
```

## 🔍 Estructura de las Pruebas

### Prueba Unitaria Ejemplo:

```javascript
describe('Usuario Model', () => {
  test('debería crear un nuevo usuario correctamente', async () => {
    // Arrange: Preparar datos
    const userData = {
      username: 'nuevousuario',
      password: 'hashedpassword',
      rol: 'user',
      id_departamento: 1
    };
    
    // Act: Ejecutar función
    const result = await Usuario.create(userData);
    
    // Assert: Verificar resultado
    expect(result).toHaveProperty('id');
    expect(result.username).toBe('nuevousuario');
  });
});
```

### Prueba de Integración Ejemplo:

```javascript
describe('GET /api/usuarios', () => {
  test('debería retornar lista de usuarios con status 200', async () => {
    // Act
    const response = await request(app)
      .get('/api/usuarios')
      .expect('Content-Type', /json/)
      .expect(200);
    
    // Assert
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

## 🎯 Casos de Prueba Cubiertos

### Casos Exitosos (Happy Path)
✅ Obtener lista de usuarios  
✅ Obtener usuario por ID  
✅ Crear usuario nuevo  
✅ Actualizar usuario existente  
✅ Eliminar usuario  
✅ Buscar usuarios  

### Casos de Error
❌ Usuario no encontrado (404)  
❌ Datos inválidos (400)  
❌ Username duplicado (400)  
❌ Errores de base de datos (500)  
❌ Rutas no existentes (404)  

### Validaciones
✔️ Paginación correcta  
✔️ Filtros de búsqueda  
✔️ Validación de campos requeridos  
✔️ Validación de formatos  
✔️ Encriptación de contraseñas  

## 🐛 Debugging de Pruebas

Para ejecutar pruebas con mayor detalle:

```bash
# Con información detallada
npm test -- --verbose

# Ejecutar una prueba específica
npm test -- Usuario.test.js

# Ejecutar con breakpoints (VSCode)
# Usar "Debug" en el panel de testing de VSCode
```

## 📚 Recursos Adicionales

- [Documentación de Jest](https://jestjs.io/docs/getting-started)
- [Documentación de Supertest](https://github.com/visionmedia/supertest)
- [Mejores prácticas de testing](https://testingjavascript.com/)

## ✅ Checklist de Testing

- [x] Pruebas unitarias del modelo
- [x] Pruebas de integración de endpoints
- [x] Configuración de Jest
- [x] Mocking de base de datos
- [x] Reporte de cobertura
- [x] Scripts npm configurados
- [ ] Tests de autenticación (próximo)
- [ ] Tests de departamentos (próximo)

---

**Última actualización**: 3 de diciembre de 2025
