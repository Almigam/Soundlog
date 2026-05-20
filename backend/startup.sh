#!/bin/bash

# Startup script para Azure App Service
set -e

echo "=== Iniciando Soundlog Backend ==="
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"

# Forzar que Python no genere archivos .pyc
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1

# Limpiar TODOS los .pyc y __pycache__
echo "Limpiando caché de Python..."
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true
find . -type f -name "*.pyd" -delete 2>/dev/null || true
echo "✅ Caché limpiado completamente"

# Mostrar contenido para debug
echo "Contenido actual:"
ls -la | head -20
echo ""

# Verificar requirements.txt
if [ ! -f "requirements.txt" ]; then
    echo "ERROR: requirements.txt no encontrado"
    exit 1
fi

# Instalar dependencias
echo "Instalando dependencias..."
python -m pip install --no-cache-dir --upgrade pip setuptools wheel
python -m pip install --no-cache-dir -r requirements.txt
echo "✅ Dependencias instaladas"

# Configurar puerto
PORT=${WEBSITES_PORT:-${PORT:-8000}}
echo "Puerto: $PORT"

# Verificar main.py
if [ ! -f "main.py" ]; then
    echo "ERROR: main.py no encontrado"
    exit 1
fi

# IMPORTANTE: Ejecutar con Python limpio
echo ""
echo "=== Lanzando Uvicorn ==="
exec python -u -m uvicorn main:app \
  --host 0.0.0.0 \
  --port $PORT \
  --proxy-headers \
  --forwarded-allow-ips '*' \
  --log-level info
