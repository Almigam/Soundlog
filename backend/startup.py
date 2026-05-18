"""
Startup script — instala dependencias y ejecuta uvicorn
"""
import subprocess
import sys
import os

# Encontrar el directorio correcto
possible_paths = [
    '/home/site/wwwroot',
    '/home/site/wwwroot/backend',
    os.path.dirname(os.path.abspath(__file__)),
]

app_dir = None
for path in possible_paths:
    req_file = os.path.join(path, 'requirements.txt')
    if os.path.exists(req_file):
        app_dir = path
        break

if not app_dir:
    print(f"❌ No se encontró requirements.txt en ninguna de estas rutas: {possible_paths}")
    sys.exit(1)

print(f"📁 Directorio de app: {app_dir}")
os.chdir(app_dir)

# Instalar dependencias
print("📦 Instalando dependencias...")
try:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'])
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
    print("✅ Dependencias instaladas")
except Exception as e:
    print(f"❌ Error instalando dependencias: {e}")
    sys.exit(1)

# Iniciar uvicorn
print("🚀 Iniciando Uvicorn en puerto 8000...")
os.execvp(sys.executable, [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'])
