# Liderplast App — Guía de Deployment en Dokploy

Esta guía detalla los pasos para desplegar la aplicación en tu VPS utilizando Dokploy.

## Requisitos Previos

1. Un servidor VPS con Dokploy instalado.
2. Un proyecto Supabase creado (para la base de datos y autenticación).
3. Repositorio de GitHub/GitLab con el código fuente (incluyendo el `Dockerfile`).

## 1. Configuración de Variables de Entorno en Dokploy

En tu proyecto de Dokploy, crea una nueva **Application** seleccionando tu repositorio.
Antes de hacer el primer deploy, ve a la pestaña **Environment** y configura las siguientes variables:

```env
# Requeridas por la aplicación (Frontend/Client)
NEXT_PUBLIC_SUPABASE_URL=https://[TU-PROYECTO].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[TU-ANON-KEY]

# Requeridas por el Servidor (Admin)
SUPABASE_SERVICE_ROLE_KEY=[TU-SERVICE-ROLE-KEY]

# Recomendadas para optimización en Docker standalone
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 2. Configuración de Build de la Aplicación

Asegúrate de configurar Dokploy para construir usando el `Dockerfile` proporcionado.

- **Build Type**: Dockerfile
- **Dockerfile Path**: `/Dockerfile` (o la ruta donde se encuentre en el repo)
- **Port**: `3000` (el puerto expuesto por el servidor Next.js standalone)

## 3. Preparación de la Base de Datos (Supabase)

Antes de que los usuarios puedan usar la aplicación, debes inicializar la estructura SQL.
En el **SQL Editor** de tu panel de Supabase:

1. Ejecuta el contenido de `db/schema.sql` (crea tablas, triggers, enums).
2. Ejecuta el contenido de `db/rls.sql` (habilita y configura las políticas de seguridad).
3. Ejecuta el contenido de `db/seeds.sql` (carga las 24 provincias argentinas).

## 4. Primer Usuario Administrador

Al registrarse el primer usuario en `/register`, por defecto se le asignará el rol `USER`.

Para hacerlo Administrador y darle acceso a los Datos Maestros y el Dashboard:
1. Ve al **Table Editor** en Supabase.
2. Abre la tabla `profiles`.
3. Busca la fila de ese usuario.
4. Cambia el campo `role` de `USER` a `ADMIN`.
5. Opcional: Cambia `can_override_prices` a `true` si deseas que pueda editar precios en el detalle de pedido manualmente.

## 5. Deploy

Una vez configurado todo, presiona **Deploy** en Dokploy.
El proceso utilizará el multi-stage Dockerfile para compilar y generar la imagen final optimizada (`standalone`).

¡La aplicación estará lista para usarse!
