param(
  [switch]$Build = $true
)

$ErrorActionPreference = "Stop"

$composeArgs = @("compose", "up", "-d")
if ($Build) {
  $composeArgs += "--build"
}

docker @composeArgs | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Compose failed. Check Docker Desktop and try again."
  exit $LASTEXITCODE
}

Write-Host "RickshawX services are starting in the background."
Write-Host ""
Write-Host "Frontend:       http://localhost:5173"
Write-Host "Auth health:    http://localhost:3001/health"
Write-Host "Ride health:    http://localhost:3002/health"
Write-Host "Trip health:    http://localhost:3004/health"
Write-Host "Payment health: http://localhost:3003/health"
Write-Host "Notify health:  http://localhost:3005/health"
Write-Host "RabbitMQ UI:    http://localhost:15672 (admin/admin)"
Write-Host ""
Write-Host "Auth flow: POST /auth/register -> POST /auth/login -> Bearer token for Ride APIs"
Write-Host "Notifications: GET /notification or /notification/user/:userId"
