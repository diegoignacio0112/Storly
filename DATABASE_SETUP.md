# 📚 Guía de Configuración de Base de Datos - Storly

Esta guía es para desarrolladores que ya están trabajando en el repositorio. Proporciona instrucciones sobre cómo configurar la nueva base de datos PostgreSQL.

## 📋 Cambios Realizados

Se ha implementado una nueva base de datos PostgreSQL con las siguientes características:
- Tabla `usuarios` con soporte para autenticación
- Contraseñas encriptadas con bcryptjs
- Sistema de migraciones automáticas
- Integración con Next.js y API routes

## 🔧 Instalación de Nuevas Dependencias

Después de hacer pull de los cambios, instala las nuevas dependencias agregadas:

```bash
npm install
```

Se instalarán automáticamente:
- `pg` (^8.20.0) - Cliente PostgreSQL para Node.js
- `bcryptjs` (^3.0.3) - Para encriptación de contraseñas
- `@types/pg` (^8.20.0) - Tipos TypeScript para pg
- `@types/bcryptjs` (^2.4.6) - Tipos TypeScript para bcryptjs

## 🌍 Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto (no está versionado en Git):

```dotenv
# Environment Configuration for Storly Database
# PostgreSQL Connection String
DATABASE_URL=postgresql://storly_user:JPPRNJkqSYsFBE8I0w4eGRrsDnCnEGRkuIwlFQVXeU8%3D@localhost:5432/storly_db

# Next.js Environment
NODE_ENV=development
```

**Nota:** El archivo `.env.local` ya está en `.gitignore` - no debe ser commiteado.

## 🐘 Iniciar PostgreSQL con Docker

```bash
docker-compose up -d
```

Verifica que el contenedor está corriendo:

```bash
docker ps | grep postgres
```

## 🔄 Ejecutar Migraciones

Una vez que PostgreSQL está corriendo, ejecuta las migraciones para crear las tablas:

```bash
npm run db:manage
```

Este comando ejecutará automáticamente todas las migraciones SQL necesarias y creará la tabla `usuarios` con datos iniciales de prueba.

## 📊 Estructura de la Base de Datos

### Tabla: `usuarios`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID único del usuario (clave primaria) |
| `nombre` | VARCHAR(255) | Nombre del usuario (requerido) |
| `email` | VARCHAR(255) | Email del usuario (único, requerido) |
| `password_hash` | VARCHAR(255) | Hash de contraseña encriptada (requerido) |
| `telefono` | VARCHAR(20) | Número de teléfono (opcional) |
| `created_at` | TIMESTAMP | Fecha de creación (automático) |
| `updated_at` | TIMESTAMP | Fecha de última actualización (automático) |

## 🔌 Conectarse a la Base de Datos

### Información de Conexión

- **Host:** localhost
- **Puerto:** 5432
- **Usuario:** storly_user
- **Contraseña:** JPPRNJkqSYsFBE8I0w4eGRrsDnCnEGRkuIwlFQVXeU8=
- **Base de datos:** storly_db

### Usar SQL Extensions en VS Code

1. Instala la extensión **SQLTools** en VS Code
2. Ve a **SQLTools** > **Add Connection**
3. Selecciona **PostgreSQL**
4. Completa con los datos de conexión anteriores
5. Prueba la conexión

## 📝 Comandos Útiles

### Ejecutar el servidor de desarrollo

```bash
npm run dev
```

### Ejecutar migraciones nuevamente

```bash
npm run db:manage
```

### Exportar datos de la base de datos

```bash
npm run db:export
```

### Importar datos a la base de datos

```bash
npm run db:import
```

## 🔄 Workflow de Desarrollo (Con Base de Datos Existente)

1. **Hacer pull de cambios**
   ```bash
   git pull
   ```

2. **Instalar nuevas dependencias** (si las hay)
   ```bash
   npm install
   ```

3. **Configurar .env.local** (si no existe aún)

4. **Asegurar que Docker está corriendo**
   ```bash
   docker-compose up -d
   ```

5. **Ejecutar migraciones** (en caso de nuevas)
   ```bash
   npm run db:manage
   ```

6. **Iniciar servidor**
   ```bash
   npm run dev
   ```

## ⚠️ Notas Importantes

- **NO commitees el archivo `.env.local`** - Contiene credenciales sensibles
- **Asegúrate de tener Docker corriendo** antes de ejecutar las migraciones
- **La contraseña de la base de datos es compartida** - En producción debe ser cambiada
- **Los cambios en schema de base de datos deben documentarse** en archivos de migración nuevos
- **Siempre ejecuta migraciones** después de hacer pull de cambios que afecten la base de datos

## 📚 Archivos Modificados

- `src/lib/db.ts` - Configuración de conexión a PostgreSQL
- `src/app/api/usuarios/route.ts` - API endpoint para registro de usuarios
- `scripts/run-migrations.ts` - Script de migraciones
- `tsconfig.json` - Configuración TypeScript actualizada
- `package.json` - Nuevas dependencias agregadas
- `migrations/` - Carpeta con archivos SQL de migraciones

---

**Última actualización:** 12 de Junio de 2026

Para preguntas o problemas, contacta al responsable del proyecto.
