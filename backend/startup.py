"""
Startup script — instala dependencias y ejecuta uvicorn
"""
import subprocess
import sys
import os

os.chdir('/home/site/wwwroot')

# Instalar dependencias
print("📦 Instalando dependencias...")
subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'])
subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])

# Iniciar uvicorn
print("🚀 Iniciando Uvicorn...")
subprocess.call([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'])
