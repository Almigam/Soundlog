# Mismas comprobaciones que el workflow de GitHub (Windows PowerShell)
# Uso: .\scripts\check.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "`n=== Dependencias de test ===" -ForegroundColor Cyan
python -m pip install -q -r requirements-dev.txt

$env:DATABASE_URL = "sqlite:///./test.db"
$env:SECRET_KEY = "test-secret-key-only-for-ci-32chars!!"
$env:ENVIRONMENT = "testing"
$env:KEYVAULT_URL = ""

Write-Host "`n=== Flake8 ===" -ForegroundColor Cyan
python -m flake8 . --config=.flake8
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Pytest ===" -ForegroundColor Cyan
python -m pytest tests/ -v --tb=short
exit $LASTEXITCODE
