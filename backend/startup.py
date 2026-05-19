"""
Startup script — instala dependencias y ejecuta uvicorn
Este script es usado como entry point en Azure App Service para asegurar que
las dependencias estén instaladas y el entorno configurado.
"""
import subprocess
import sys
import os
import logging

# Configurar logging básico para ver en la consola de Azure
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

logger.info("Iniciando proceso de startup...")

# Forzar el directorio de trabajo al lugar donde está el script
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
logger.info(f"Directorio actual: {os.getcwd()}")

# Verificar si estamos en Azure
is_azure = os.getenv('WEBSITE_INSTANCE_ID') is not None
if is_azure:
    logger.info("Detectado entorno de Azure App Service")
else:
    logger.info("Detectado entorno local")

# 1. Instalar/Actualizar dependencias si es necesario
# En Azure, Oryx debería hacerlo, pero esto sirve de backup
if os.path.exists('requirements.txt'):
    logger.info("Verificando/Instalando dependencias desde requirements.txt...")
    try:
        # Usamos sys.executable para asegurar que usamos el mismo python que el script
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'],
                              stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        logger.info("Dependencias verificadas/instaladas")
    except Exception as e:
        logger.error(f"Error instalando dependencias: {e}")
        # No salimos, intentamos arrancar igual por si ya están
else:
    logger.warning("No se encontró requirements.txt")

# 2. Configurar puerto (Azure usa WEBSITE_PORT o WEBSITES_PORT o 8000 por defecto)
port = int(os.getenv('WEBSITES_PORT', os.getenv('PORT', 8000)))
logger.info(f"Usando puerto: {port}")

# 3. Iniciar uvicorn
logger.info("Lanzando Uvicorn...")
try:
    # Usamos os.execvp para reemplazar el proceso actual
    # Esto asegura que las señales (SIGTERM) lleguen directamente a uvicorn
    args = [
        sys.executable, '-m', 'uvicorn',
        'main:app',
        '--host', '0.0.0.0',
        '--port', str(port),
        '--proxy-headers',  # Importante detrás de load balancers de Azure
        '--forwarded-allow-ips', '*',
        '--log-level', 'info'
    ]

    # En producción no queremos reload
    if os.getenv('ENVIRONMENT') != 'production':
        args.append('--reload')

    logger.info(f"Ejecutando: {' '.join(args)}")
    os.execvp(sys.executable, args)
except Exception as e:
    logger.error(f"Error fatal al iniciar la aplicación: {e}")
    sys.exit(1)
