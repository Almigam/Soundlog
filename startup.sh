#!/bin/bash

# Startup script para Azure App Service
# Instala dependencias y ejecuta la aplicación

set -e

echo "Iniciando Soundlog Backend..."
echo "Python version: $(python --version)"

# Cambiar al directorio del backend
cd "$(dirname "$0")/backend" || cd /home/site/wwwroot/backend

# Instalar dependencias
echo "Instalando/Actualizando dependencias..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Configurar puerto
PORT=${WEBSITES_PORT:-${PORT:-8000}}
echo "Usando puerto: $PORT"

# Ejecutar aplicación
echo "Lanzando Uvicorn..."
python -m uvicorn main:app \
  --host 0.0.0.0 \
  --port $PORT \
  --proxy-headers \
  --forwarded-allow-ips '*' \
  --log-level info
