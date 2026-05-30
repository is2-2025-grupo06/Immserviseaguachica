# Immersive Aguachica — Instrucciones de instalación

## Requisitos
- Node.js 18+
- MySQL 8+

## Pasos

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env con tu usuario y contraseña de MySQL
```

### 3. Crear la base de datos
Importa el schema en MySQL:
```bash
mysql -u root -p < database/schema.sql
```

### 4. Iniciar el servidor
```bash
# Desarrollo (con recarga automática)
npm run dev

# Producción
npm start
```

El sitio quedará disponible en: http://localhost:3000

## Tabla de usuarios (inicio de sesión)
La tabla `usuarios` guarda: id, nombre, apellidos, correo.
Los usuarios se registran desde el modal de bienvenida del sitio.

## Rutas de autenticación
- `POST /api/register` → Registro con nombre, apellidos, correo, password
- `POST /api/login`    → Inicio de sesión con correo y password
