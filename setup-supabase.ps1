# ============================================================
# REPÓRTATE — Script de configuración inicial de Supabase
# Uso: Primero completa .env, luego ejecuta este script:
#      .\setup-supabase.ps1
# ============================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Leer variables del .env ---
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Error "No se encontró el archivo .env en $PSScriptRoot"
    exit 1
}

$env_vars = @{}
Get-Content $envPath -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if ($line -notmatch '^#' -and $line -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
        $env_vars[$Matches[1]] = $Matches[2].Trim()
    }
}

$ACCESS_TOKEN    = $env_vars["SUPABASE_ACCESS_TOKEN"]
$PROJECT_REF     = $env_vars["SUPABASE_PROJECT_REF"]
$URL             = $env_vars["EXPO_PUBLIC_SUPABASE_URL"]
$ANON_KEY        = $env_vars["EXPO_PUBLIC_SUPABASE_ANON_KEY"]
$SERVICE_KEY     = $env_vars["SUPABASE_SERVICE_ROLE_KEY"]

# --- Validar placeholders ---
$placeholders = @("INSERTE_ACCESS_TOKEN_AQUI", "INSERTE_PROJECT_REF_AQUI",
                  "INSERTE_PROJECT_URL_AQUI", "INSERTE_ANON_KEY_AQUI",
                  "INSERTE_SERVICE_ROLE_KEY_AQUI")

$missing = @()
foreach ($key in @("SUPABASE_ACCESS_TOKEN","SUPABASE_PROJECT_REF",
                   "EXPO_PUBLIC_SUPABASE_URL","EXPO_PUBLIC_SUPABASE_ANON_KEY",
                   "SUPABASE_SERVICE_ROLE_KEY")) {
    if (-not $env_vars.ContainsKey($key) -or $env_vars[$key] -in $placeholders) {
        $missing += $key
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROR: Faltan los siguientes valores en .env:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "Abre el archivo .env y completa cada campo antes de volver a correr este script." -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   REPÓRTATE — Configuración de Supabase   " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $ACCESS_TOKEN"
    "Content-Type"  = "application/json"
}

# ============================================================
# PASO 1 — Ejecutar migración SQL
# ============================================================
Write-Host "[1/2] Ejecutando migración SQL..." -ForegroundColor Yellow

$sqlFile = Join-Path $PSScriptRoot "supabase\migrations\001_initial_schema.sql"
$sql = Get-Content $sqlFile -Raw -Encoding UTF8

$body = [ordered]@{ query = $sql } | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod `
        -Uri "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ContentType "application/json"

    Write-Host "     Migración ejecutada correctamente." -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $responseBody = $_.ErrorDetails.Message
    Write-Host "     Error en la migración (HTTP $statusCode):" -ForegroundColor Red
    Write-Host "     $responseBody" -ForegroundColor Red
    Write-Host ""
    Write-Host "     Si el error es sobre tablas/tipos que ya existen, es seguro ignorarlo." -ForegroundColor Yellow
    $continue = Read-Host "     ¿Continuar con el despliegue de la Edge Function? (s/n)"
    if ($continue -ne "s") { exit 1 }
}

# ============================================================
# PASO 2 — Desplegar Edge Function
# ============================================================
Write-Host ""
Write-Host "[2/2] Desplegando Edge Function 'send-notification'..." -ForegroundColor Yellow

$functionDir = Join-Path $PSScriptRoot "supabase\functions\send-notification"
$indexFile   = Join-Path $functionDir "index.ts"
$functionCode = Get-Content $indexFile -Raw -Encoding UTF8

# Codificar en base64
$bytes = [System.Text.Encoding]::UTF8.GetBytes($functionCode)
$base64 = [Convert]::ToBase64String($bytes)

$functionBody = @{
    slug         = "send-notification"
    name         = "send-notification"
    body         = $base64
    verify_jwt   = $false
} | ConvertTo-Json -Depth 5

try {
    # Intentar crear la función; si ya existe, actualizarla
    try {
        Invoke-RestMethod `
            -Uri "https://api.supabase.com/v1/projects/$PROJECT_REF/functions" `
            -Method POST `
            -Headers $headers `
            -Body $functionBody `
            -ContentType "application/json" | Out-Null
    } catch {
        # La función ya existe: hacer PATCH
        Invoke-RestMethod `
            -Uri "https://api.supabase.com/v1/projects/$PROJECT_REF/functions/send-notification" `
            -Method PATCH `
            -Headers $headers `
            -Body $functionBody `
            -ContentType "application/json" | Out-Null
    }

    # Configurar el secret SUPABASE_SERVICE_ROLE_KEY en la función
    $secretBody = @(@{ name = "SUPABASE_SERVICE_ROLE_KEY"; value = $SERVICE_KEY }) | ConvertTo-Json
    Invoke-RestMethod `
        -Uri "https://api.supabase.com/v1/projects/$PROJECT_REF/secrets" `
        -Method POST `
        -Headers $headers `
        -Body $secretBody `
        -ContentType "application/json" | Out-Null

    Write-Host "     Edge Function desplegada correctamente." -ForegroundColor Green
} catch {
    Write-Host "     Error al desplegar la Edge Function:" -ForegroundColor Red
    Write-Host "     $($_.ErrorDetails.Message)" -ForegroundColor Red
    Write-Host "     Puedes desplegarla manualmente desde el dashboard de Supabase." -ForegroundColor Yellow
}

# ============================================================
# RESUMEN
# ============================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Configuración completada                 " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Ejecuta la app:  npx expo start" -ForegroundColor White
Write-Host "  2. Escanea el QR con Expo Go en tu celular" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: Rota el Access Token después de este setup:" -ForegroundColor Yellow
Write-Host "  supabase.com/dashboard/account/tokens" -ForegroundColor Yellow
Write-Host ""
