#!/bin/bash

# Startup script para Azure App Service
# Instala dependencias y ejecuta la aplicación

set -e

echo "Iniciando Soundlog Backend..."
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"

# En Azure, el código está en /home/site/wwwroot
# Nos posicionamos allí
if [ -d "/home/site/wwwroot" ]; then
    cd /home/site/wwwroot
    echo "Cambiado a directorio: $(pwd)"
fi

# Verificar que requirements.txt existe
if [ ! -f "requirements.txt" ]; then
    echo "ERROR: requirements.txt no encontrado en $(pwd)"
    ls -la
    exit 1
fi

# Instalar dependencias
echo "Instalando/Actualizando dependencias..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Configurar puerto
PORT=${WEBSITES_PORT:-${PORT:-8000}}
echo "Usando puerto: $PORT"

# Verificar que main.py existe
if [ ! -f "main.py" ]; then
    echo "ERROR: main.py no encontrado en $(pwd)"
    ls -la
    exit 1
fi

# Ejecutar aplicación
echo "Lanzando Uvicorn..."
python -m uvicorn main:app \
  --host 0.0.0.0 \
  --port $PORT \
  --proxy-headers \
  --forwarded-allow-ips '*' \
  --log-level info
