import os
import sys

# Añadir el directorio actual al path para poder importar core
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal
from core.models import User
from core.security import get_password_hash

def seed():
    db = SessionLocal()
    try:
        # Verificar si el usuario ya existe
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Creando usuario por defecto: admin / Soundlog2024!")
            new_user = User(
                username="admin",
                email="admin@example.com",
                full_name="Administrador de Pruebas",
                hashed_password=get_password_hash("Soundlog2024!"),
                is_active=True
            )
            db.add(new_user)
            db.commit()
            print("✅ Usuario admin creado con éxito.")
        else:
            print("ℹ️ El usuario admin ya existe.")
            
        # Otro usuario de prueba más simple
        test_user = db.query(User).filter(User.username == "test").first()
        if not test_user:
            print("Creando usuario por defecto: test / TestPass123!")
            new_user = User(
                username="test",
                email="test@example.com",
                full_name="Usuario de Prueba",
                hashed_password=get_password_hash("TestPass123!"),
                is_active=True
            )
            db.add(new_user)
            db.commit()
            print("✅ Usuario test creado con éxito.")
        else:
            print("ℹ️ El usuario test ya existe.")
            
    except Exception as e:
        print(f"❌ Error al crear usuarios: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
