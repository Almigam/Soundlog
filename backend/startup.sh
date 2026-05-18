#!/bin/bash

# Instalar dependencias Python
echo "📦 Instalando dependencias Python..."
cd /home/site/wwwroot
pip install --upgrade pip
pip install -r requirements.txt

# Iniciar uvicorn
echo "🚀 Iniciando Uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
