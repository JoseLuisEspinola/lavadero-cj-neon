# Lavadero CJ

Sitio web de Lavadero CJ con reservas de turnos y panel de administración protegido, usando Express, Vercel y Neon.

## Estructura

Se conserva la ubicación actual del frontend: páginas HTML en la raíz y carpetas `css/`, `js/` e `img/`. El backend nuevo está separado en `api/` y `src/`; `vercel.json` publica el sitio desde la raíz y dirige `/api/*` a la función.

## Funcionalidades

- Sitio actual, con su formulario de contacto y diseño conservados.
- Reserva de turnos con disponibilidad por fecha/hora, prevención de reservas duplicadas y límite por teléfono.
- Registro del vehículo y del importe vigente para cada turno de lavado; los demás servicios quedan a cotizar.
- Acceso **DATOS** en la navegación para administrar turnos y consultar mensajes.
- Edición de precios por tipo de vehículo desde **DATOS**; el importe de un turno reservado conserva el precio que tenía al reservarse.
- Marcado de turnos como realizados para registrar lo recaudado; al cerrar un servicio cotizable se ingresa el importe efectivamente cobrado.
- Filtro de turnos por rango de fechas y resumen de recaudación, importes reservados pendientes y servicios a cotizar.
- Inicio de sesión de administrador con cookie firmada y duración de 8 horas.
- Las tablas `turnos`, `mensajes` y `precios_vehiculos` se inicializan automáticamente al primer uso de la API. Las columnas de vehículo e importe también se agregan automáticamente a instalaciones existentes. [schema.sql](./schema.sql) contiene el SQL de referencia.

## Configuración local

1. Instalá Node.js 18 o posterior.
2. Ejecutá `npm install`.
3. Copiá `.env.example` como `.env` y configurá:
   - `DATABASE_URL`: URL de conexión de Neon.
   - `ADMIN_PASSWORD`: clave del panel DATOS, con 8 caracteres o más.
   - `SESSION_SECRET`: secreto aleatorio de 16 caracteres o más.
4. Ejecutá `npm start` y abrí `http://localhost:3000`.

## Despliegue en Vercel

Importá este proyecto en Vercel y cargá `DATABASE_URL`, `ADMIN_PASSWORD` y `SESSION_SECRET` en **Settings > Environment Variables** para cada entorno de despliegue. La función de `api/` sirve los endpoints; Vercel publica los archivos del sitio desde la raíz del proyecto.

No subas `.env` al repositorio. Las tablas se crean automáticamente cuando se accede por primera vez a la API; también podés ejecutar [schema.sql](./schema.sql) en Neon.
