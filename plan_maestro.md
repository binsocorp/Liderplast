# PLAN .MD — Arquitectura y Blueprint de Desarrollo (NO generar código aún)
**Proyecto:** App de gestión para fábrica de piletas de fibra (Córdoba → Argentina)  
**Stack:** Next.js + Tailwind CSS + Supabase (Postgres + Auth)  
**Hosting:** VPS con Dokploy (deploy containerizado)  
**Idioma UI:** Español  
**MVP:** sin WhatsApp, sin automatizaciones, sin capacidad de viajes, sin pagos/señas

---

## 0) Objetivo del plan
Definir una arquitectura completa (datos + permisos + páginas + estructura de repo + despliegue) para que un IDE/agent pueda construir el sistema con contexto total, **pero sin implementar ahora**.

---

## 1) Alcance funcional (MVP)

### Sistema debe permitir
- Registrar **Pedidos** (de vendedores internos y revendedores)
- Trackear pedidos por **estado**
- Asignar **Viajes** a pedidos (1 viaje incluye N pedidos)
- Asignar **Instalador** a cada pedido (no cambia el estado, solo `installer_id`)
- Mantener **Datos Maestros editables**: productos/servicios, precios por provincia, clientes, revendedores, proveedores, instaladores, vendedores, provincias
- Dashboard **solo Admin** con indicadores clave de ventas

### No objetivos (MVP)
- No WhatsApp ni automatizaciones
- No capacidad/constraints de viajes
- No pagos/señas
- No importadores masivos (carga manual inicial)

---

## 2) Definiciones de negocio
- `CONFIRMADO` = cotización aceptada (sin seña / sin módulo de pagos).
- Todos los precios son **NETOS** (sin impuestos).
- Impuestos se cargan manualmente en `tax_amount_manual`.
- Provincias con precio **0 o negativo** se consideran **no vendibles**:
  - Deben estar marcadas con `provinces.is_sellable=false`
  - Debe impedirse crear/guardar pedidos en esas provincias.
- `VIAJE_ASIGNADO` solo es válido cuando `trip_id` está asignado.
- La asignación de instalador **no es un estado**, es `installer_id != null`.

---

## 3) Roles y permisos (modelo)
### Roles
1) **Admin**
- CRUD total de: maestros, pedidos, ítems, viajes
- Acceso a Dashboard

2) **User**
- Puede crear/editar: Pedidos y sus ítems
- Puede ver `total_net`
- Puede leer listas de viajes e instaladores para asignar
- No puede acceder al dashboard
- No puede editar maestros (salvo si Admin habilita)

### Reglas finas recomendadas
- `profiles.can_override_prices` (boolean):
  - Admin: true
  - User: false por defecto
  - Si false: user no puede modificar `unit_price_net` en ítems (solo lo copia desde Prices)

---

## 4) Entidades / Tablas (modelo conceptual)
### Core
- Provinces
- Clients
- Sellers (tipo INTERNO/REVENDEDOR)
- Resellers
- Suppliers
- CatalogItems (productos/servicios)
- Prices (matriz por provincia)
- Installers
- Trips
- Orders
- OrderItems

### Usuarios / Suscripciones (extra requerido)
- profiles (rol y flags)
- user_subscriptions (suscripciones activas del usuario)
- subscription_expenses (historial de gastos/pagos)

---

## 5) Reglas de integridad y validaciones críticas
### Orders
- Rechazar insert/update si `province.is_sellable=false`
- Si `channel=REVENDEDOR` entonces `reseller_id` obligatorio
- `total_net = subtotal_products + subtotal_services - discount_amount + tax_amount_manual`
- `total_net` visible a Admin y User
- snapshot de entrega:
  - `delivery_address` se guarda en el pedido aunque cambie el cliente después

### OrderItems
- `unit_price_net` por defecto viene de `prices` según provincia del pedido
- `subtotal_net = quantity * unit_price_net`

### Prices
- Si provincia no vendible → bloquear uso en pedidos (por regla de Orders)
- Mantener `active` para vigencia de precio

---

## 6) Páginas / UX (diseño mínimo)
### 6.1 Orders (Home)
Tabla con filtros:
- status, channel, reseller, province
- viaje asignado (sí/no)
- instalador asignado (sí/no)

Columnas:
- order_number, cliente, provincia, localidad, status, viaje asignado, instalador asignado, total_net, created_at

### 6.2 Order Detail
Secciones:
- Cliente y entrega
- Info comercial (channel/seller/reseller)
- Items PRODUCTO
- Items SERVICIO
- Totales (subtotales, descuento, impuestos manuales, total)
- Asignación operativa: trip_id, installer_id
Acciones rápidas (shortcuts):
- Agregar Kit Losetas (3 líneas)
- Agregar Combo Accesorios (4 líneas)
- Agregar Kit Extras (4 líneas)
> No son combos con descuento: solo agregan ítems separados.

### 6.3 Master Data (Admin)
CRUD screens (list + detail + create):
- Provinces, Clients, Sellers, Resellers, Suppliers, CatalogItems, Prices, Installers, Trips

### 6.4 Admin Dashboard (Admin)
Gráficos/tablas:
- Ventas en el tiempo (rango de fecha)
- Interno vs Revendedor
- Performance por revendedor (selector)
- Pedidos por estado
- Split Productos vs Servicios
Filtros: rango fecha, canal, revendedor, provincia

---

## 7) Arquitectura técnica (alto nivel)
### Frontend
- Next.js App Router + TypeScript
- Tailwind CSS
- Componentes: tablas + filtros + badges + formularios por sección

### Backend
- Supabase Postgres + RLS para permisos
- Supabase Auth (Login/Registro)
- Server Actions o Route Handlers para escrituras (recomendado validar con Zod)

### Seguridad
- Nunca confiar en validación del cliente
- RLS en todas las tablas
- Dashboard: solo Admin (vistas o queries protegidas)

---

## 8) Estructura de repositorio (recomendada)/app
/(auth)/login
/(auth)/register
/(app)/orders
/(app)/orders/[id]
/(app)/trips
/(app)/installers
/(admin)/dashboard
/(admin)/master/...
/components
/lib
/supabase (client/server)
/validation (zod schemas)
/domain (totales, kits)
/db
schema.sql
rls.sql
seeds.sql
/docker
Dockerfile
dokploy-notes.md
/docs
PLAN.md


---

## 9) SQL — Blueprint (qué debe incluir el archivo schema.sql)
> El agente/IDE debe generar SQL listo para pegar en Supabase SQL Editor, incluyendo:
- ENUMs: roles, tipos, estados, etc.
- Tablas: todas las entidades listadas
- FK + índices por filtros habituales (status, province, channel, trip_id)
- Triggers/funciones recomendadas:
  - autonumeración (`order_number`, `trip_code`)
  - cálculo de subtotales/total (o alternativa con vistas si se prefiere)
  - validación de provincia vendible + reseller requerido

### 9.1 Supabase Auth
- Usar `auth.users` (nativa)
- Crear `public.profiles` con `role` y `can_override_prices`

### 9.2 Suscripciones activas (campos mínimos necesarios)
**user_subscriptions**
- user_id (owner)
- name (nombre servicio)
- vendor (proveedor/marca)
- category (hosting/saas/etc.)
- status (ACTIVE/PAUSED/CANCELLED)
- billing_cycle (MONTHLY/YEARLY/OTHER)
- currency (ARS/USD)
- amount (monto esperado por ciclo)
- start_date, renewal_date (control vencimientos)
- payment_method (texto)
- notes

**subscription_expenses**
- user_id (owner)
- subscription_id (opcional)
- expense_date
- period_year, period_month (imputación)
- amount
- currency
- vendor_snapshot
- note
- created_at

---

## 10) RLS — Blueprint (qué debe incluir rls.sql)
- Habilitar RLS en todas las tablas
- Policies:
  - `profiles`: cada user solo ve su profile; Admin puede ver todos
  - Maestros: solo Admin puede write; lectura puede ser:
    - lectura total para User si lo necesita para seleccionar (catalog/prices/provinces)
  - Orders/OrderItems:
    - Para MVP: permitir a cualquier usuario autenticado ver/editar todos los pedidos (si es un sistema interno compartido)
    - Alternativa más estricta (si se requiere multi-tenant): agregar `created_by` en orders y filtrar por user. (Definir antes de implementar)
  - Dashboard: solo Admin

> Decisión a fijar antes de implementar:
**Modo de visibilidad de pedidos**
A) “Sistema interno”: todos los usuarios ven todos los pedidos (simple)  
B) “Por usuario”: solo ve los pedidos que creó (más seguro)  
C) “Por equipo”: requiere tabla de equipos/tenancy (más complejo)

Para MVP, recomendado: A) interno compartido.

---

## 11) Seeds (seeds.sql) — Blueprint
- Insertar Provincias de Argentina + CABA
- Dejar `is_sellable=true` por defecto
- Admin luego marca no vendibles manualmente
- No cargar catálogo/precios automáticamente (MVP: carga manual)

---

## 12) Despliegue en Dokploy (VPS)
- App Next.js en Docker
- Variables de entorno:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (solo server, si se usa; evitar si RLS alcanza)
- Build: `next build`
- Run: `next start`
- Reverse proxy (Dokploy) con dominio propio

---

## 13) Checklist de implementación (orden recomendado)
1) Definir decisión de visibilidad de pedidos (A/B/C)
2) Crear schema.sql y correr en Supabase
3) Crear RLS policies (rls.sql)
4) Crear seeds (provincias)
5) Implementar Auth + profiles
6) Implementar módulo Orders + Order Detail
7) Implementar Trips + Installers (listado y asignación)
8) Implementar Admin Master Data CRUD
9) Implementar Dashboard Admin

---

## 14) Criterios de aceptación (MVP)
- User puede crear pedido con provincia vendible y canal válido
- Si canal=REVENDEDOR → reseller_id obligatorio
- User ve total_net
- User no puede editar maestros ni dashboard
- Admin puede gestionar maestros y ver dashboard
- Se pueden asignar viajes y instaladores a pedidos
- Items toman precio por provincia automáticamente; user no puede override salvo permiso

---
FIN DEL PLAN