# Scripts de PowerShell para probar el API Gateway

# ============================================
# HEALTH CHECKS
# ============================================

# Verificar API Gateway
Write-Host "`n=== Health Check API Gateway ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET | ConvertTo-Json

# Verificar Auth Service
Write-Host "`n=== Health Check Auth Service ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:3003/health" -Method GET | ConvertTo-Json

# ============================================
# AUTENTICACIÓN
# ============================================

# Login como admin
Write-Host "`n=== Login como Admin ===" -ForegroundColor Green
$loginBody = @{
    username = "admin"
    password = "123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$loginResponse | ConvertTo-Json -Depth 5
$token = $loginResponse.data.accessToken
Write-Host "`nToken guardado: $token" -ForegroundColor Yellow

# ============================================
# OBTENER PERFIL
# ============================================

Write-Host "`n=== Obtener Perfil (con token) ===" -ForegroundColor Green
$headers = @{
    Authorization = "Bearer $token"
}

$profile = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" `
    -Method GET `
    -Headers $headers

$profile | ConvertTo-Json -Depth 5

# ============================================
# LISTAR USUARIOS
# ============================================

Write-Host "`n=== Listar Usuarios (con token) ===" -ForegroundColor Green
$usuarios = Invoke-RestMethod -Uri "http://localhost:3000/api/usuarios?page=1&limit=10" `
    -Method GET `
    -Headers $headers

$usuarios | ConvertTo-Json -Depth 5

# ============================================
# LISTAR DEPARTAMENTOS
# ============================================

Write-Host "`n=== Listar Departamentos (con token) ===" -ForegroundColor Green
$departamentos = Invoke-RestMethod -Uri "http://localhost:3000/api/departamentos?page=1&limit=10" `
    -Method GET `
    -Headers $headers

$departamentos | ConvertTo-Json -Depth 5

# ============================================
# CREAR NUEVO USUARIO
# ============================================

Write-Host "`n=== Crear Nuevo Usuario ===" -ForegroundColor Green
$nuevoUsuario = @{
    username = "test.usuario"
    password = "123456"
    rol = "usuario"
    id_departamento = 1
} | ConvertTo-Json

$nuevoUser = Invoke-RestMethod -Uri "http://localhost:3000/api/usuarios" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $nuevoUsuario

$nuevoUser | ConvertTo-Json -Depth 5

# ============================================
# CREAR NUEVO DEPARTAMENTO
# ============================================

Write-Host "`n=== Crear Nuevo Departamento ===" -ForegroundColor Green
$nuevoDepartamento = @{
    nombre = "Operaciones"
    descripcion = "Departamento de operaciones y logística"
} | ConvertTo-Json

$nuevoDepto = Invoke-RestMethod -Uri "http://localhost:3000/api/departamentos" `
    -Method POST `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $nuevoDepartamento

$nuevoDepto | ConvertTo-Json -Depth 5

Write-Host "`n=== Pruebas completadas ===" -ForegroundColor Cyan
