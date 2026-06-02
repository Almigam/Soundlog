# Estrategia de Pruebas - Soundlog

Este documento describe la configuración de pruebas y calidad de código para el proyecto Soundlog.

## 1. Pruebas del Backend (FastAPI)

Utilizamos **pytest** para las pruebas del backend. Las pruebas se dividen en unitarias e integración.

### Cómo ejecutar las pruebas
Desde la raíz del proyecto o desde la carpeta `backend`:
```bash
pytest backend/tests -v
```

### Configuración
- **Base de Datos:** Se utiliza una base de datos SQLite en memoria (`sqlite://`) con `StaticPool` para asegurar aislamiento y velocidad.
- **Fixtures:**
  - `db_session`: Proporciona una sesión de BD limpia para cada test.
  - `client`: Proporciona un `TestClient` de FastAPI con la dependencia de BD inyectada.

## 2. Pruebas del Frontend (React + TypeScript)

Utilizamos **Vitest** y **React Testing Library**.

### Cómo ejecutar las pruebas
Desde la carpeta `frontend`:
```bash
npm test
```
O para modo watch:
```bash
npm run test:watch
```

### Configuración
- **Entorno:** `jsdom` para simular el DOM del navegador.
- **Setup:** `frontend/src/setupTests.ts` importa `@testing-library/jest-dom` para matchers adicionales.

## 3. Seguridad y Calidad de Código

### Secret Scanning
Utilizamos **Gitleaks** para prevenir que se suban secretos al repositorio.
- Configurado como hook de `pre-commit`.
- Configurado como GitHub Action (`.github/workflows/secret-scan.yml`).

### Hooks de Pre-commit
El proyecto tiene configurado `pre-commit` para ejecutar validaciones antes de cada commit:
1. Limpieza de espacios en blanco y fin de archivos.
2. Gitleaks (Secret Scan).
3. Flake8 (Linting Backend).
4. Pytest (Tests Backend).
5. ESLint (Linting Frontend).
6. Vitest (Tests Frontend).

Para instalar los hooks:
```bash
pre-commit install
```

Para ejecutarlos manualmente:
```bash
pre-commit run --all-files
```

## 4. Integración Continua (GitHub Actions)

Los workflows en `.github/workflows` ejecutan automáticamente:
- Pruebas de backend y frontend en cada Pull Request.
- Despliegue de infraestructura con Terraform.
- Escaneo de secretos.
- Auditoría de seguridad.
