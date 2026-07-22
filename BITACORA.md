# Bitácora del proyecto — RUDOS BARBER Inventario

Registro cronológico de las sesiones de trabajo con Claude Code sobre este repositorio.
Cada entrada resume qué se hizo, qué se decidió y qué queda pendiente, para poder retomar
el trabajo en cualquier momento (por ejemplo, tras reiniciar el equipo) sin perder contexto.

Convención: entradas más recientes al final. Formato de fecha `AAAA-MM-DD`.

---

## 2026-07-15

**Hecho:**
- Se analizó el repositorio (`_diseno_extraido/Rudos Barber Inventario.dc.html` + `support.js`)
  y se creó `CLAUDE.md` documentando la arquitectura: formato `.dc.html` (plantilla + lógica de
  componente en un solo archivo), runtime `dc-runtime` (vendido/generado, no editar `support.js`),
  modelo de estado (`products`, `movements`, `sales`, `users`) y reglas de negocio (stock bajo,
  stock insuficiente en salidas/ventas).
- Se creó este archivo `BITACORA.md` para llevar un registro persistente de las interacciones.

**Pendiente / próximos pasos:**
- Ninguno definido aún. A la espera de la siguiente solicitud del usuario sobre el proyecto.

---

## 2026-07-15 (continuación) — App real con Supabase

**Decisiones acordadas con el usuario:**
- Convertir el prototipo estático en una app real: **Vite + React + TypeScript** en el frontend,
  **Supabase** (Postgres + Auth) como backend, sin servidor propio.
- Login mantiene el campo corto **"usuario"** (no email real); internamente se sintetiza
  `usuario@rudosbarber.local` para que Supabase Auth (nativamente por email) funcione por debajo.
- Sin confirmación de correo al crear usuarios (uso interno).
- El usuario aún no tenía proyecto Supabase creado — se construyó todo contra el esquema SQL real
  para que solo falte pegar credenciales cuando lo cree.

**Hecho:**
- Migraciones SQL en `supabase/migrations/`: `0001_init.sql` (tablas `profiles`, `products`,
  `movements`, `sales`, vista `v_inventory_valuation`, trigger `handle_new_user` que auto-crea el
  profile al registrarse en `auth.users`, políticas RLS single-tenant) y `0002_rpc_movimientos.sql`
  (`registrar_entrada/salida/venta`: funciones transaccionales que hacen el chequeo-y-decremento de
  stock en una sola sentencia atómica, evitando condiciones de carrera).
- Proyecto Vite+React+TS scaffolded en `app/`, con Tailwind CSS v4 (config CSS-first vía `@theme` en
  `src/index.css`, paleta calcada del prototipo), `@supabase/supabase-js`, `@tanstack/react-query`,
  `react-router-dom`, `clsx`, `zod`.
- Implementadas las 7 pantallas (Dashboard, Productos, Entradas, Salidas, Ventas, Reportes,
  Usuarios) + Login, con `AuthContext`, `AppLayout`/`Sidebar`/`Header`/`LowStockModal`, hooks de
  datos (`useProducts`, `useMovements`, `useSales`, `useProfiles`, `useDashboardStats`) y componentes
  UI reutilizables (`Card`, `KpiCard`, `Table`, `Badge`, `Button`, `FormField`).
- Alta de usuarios usa un cliente Supabase auxiliar (`supabaseSignupClient.ts`, `persistSession:
  false`) para no cerrar la sesión del admin al crear un nuevo usuario.
- Desviaciones deliberadas vs. el prototipo (documentadas en `CLAUDE.md`): la tabla de Usuarios ya no
  muestra columna de clave (Supabase Auth no la expone), y el login ya no muestra contadores en vivo
  de productos/stock bajo (RLS bloquea esas tablas para usuarios no autenticados).
- Verificado: `npx tsc -b` sin errores, `npm run build` genera bundle de producción sin errores,
  `npm run lint` limpio (solo un warning cosmético de Fast Refresh en `AuthContext.tsx`), y
  `npm run dev` levanta el servidor y sirve el HTML correctamente.
- `CLAUDE.md` reescrito para reflejar la nueva arquitectura real (comandos, estructura, RPC
  transaccional, auth por "usuario" sintético, desviaciones del prototipo, pasos de setup manual de
  Supabase).

**No verificado (requiere que el usuario cree su proyecto Supabase):**
- Ningún flujo real contra Supabase (login, crear producto, registrar entrada/salida/venta, alta de
  usuario) se ha probado end-to-end — no hay credenciales reales todavía. `app/.env.local` tiene
  valores placeholder (`https://placeholder.supabase.co`) solo para que la app compile/arranque.
- No se ha visto la UI en un navegador real (sin herramienta de captura de pantalla disponible en
  este entorno); solo se confirmó que el servidor de desarrollo responde y sirve el HTML esperado.

**Pendiente / próximos pasos:**
1. ~~El usuario debe crear su proyecto en supabase.com...~~ Hecho (ver entrada siguiente).
2. Probar el flujo completo en el navegador (CRUD de productos, entradas/salidas/ventas, alertas de
   stock bajo, alta de un segundo usuario) siguiendo la sección de verificación del plan aprobado.
3. Decidir y configurar el hosting de despliegue (Vercel/Netlify u otro) cuando se quiera pasar de
   local a un dominio propio.

---

## 2026-07-15 (continuación 2) — Setup real de Supabase + Editar/Eliminar/Inactivar productos

**Hecho:**
- El usuario creó su proyecto Supabase (`RudosBarber`, región `ca-central-1`), corrió `0001_init.sql`
  y `0002_rpc_movimientos.sql` en el SQL Editor, desactivó "Confirm email", y creó el usuario admin
  inicial (`admin@rudosbarber.local`) desde el dashboard — el trigger `handle_new_user` generó su
  `profile` correctamente (`usuario = admin`, `rol = Administrador`).
- `app/.env.local` actualizado con las credenciales reales del proyecto (usa el sistema nuevo de
  Supabase de "Publishable key" en vez de la `anon key` legacy — funcionalmente equivalente).
- **Login real verificado end-to-end**: el usuario entró con `admin` + su clave y confirmó que el
  dashboard carga correctamente (en cero, sin los 12 productos demo del prototipo, como se esperaba
  de una base de datos nueva). Creó un producto de prueba y confirmó que aparece en el catálogo.
- Nueva funcionalidad en Productos: **Editar** (modal con descripción/marca/presentación/stock
  mínimo/precio — nunca toca `stock`, que solo cambia vía Entradas/Salidas/Ventas), **Eliminar**
  (solo si el producto no tiene movimientos — protegido a nivel de base de datos por la FK
  `on delete restrict`, no solo en el cliente) e **Inactivar/Reactivar** (nueva columna `activo` en
  `products`, migración `0003_products_activo.sql`). Los productos inactivos se muestran atenuados
  con badge "Inactivo" en el catálogo pero se excluyen de los selectores de producto en
  Entradas/Salidas/Ventas.
- Verificado: `npx tsc -b`, `npm run build` y `npm run lint` limpios tras el cambio.

**Verificado por el usuario en el navegador (todo funcionó):**
- Migración `0003_products_activo.sql` corrida sin errores.
- Editar un producto (cambio de datos) se guarda correctamente.
- Eliminar un producto sin movimientos funciona (desaparece del catálogo).
- Registrar una Entrada a un producto y volver a Productos muestra "Inactivar" en vez de "Eliminar";
  al inactivarlo queda atenuado con badge "Inactivo" y desaparece de los selectores de
  Entradas/Salidas/Ventas.

**Pendiente / próximos pasos:**
1. Seguir probando el resto del flujo (salidas/ventas con stock insuficiente, alertas de stock bajo,
   alta de un segundo usuario) siguiendo la sección de verificación del plan aprobado.
2. Decidir y configurar el hosting de despliegue (Vercel/Netlify u otro) cuando se quiera pasar de
   local a un dominio propio.

---

## 2026-07-15 (continuación 3) — Cliente en Ventas + comprobante imprimible

**Hecho:**
- Migración `0004_sales_cliente.sql`: columna `cliente` en `sales`, y `registrar_venta` recreada con
  un nuevo parámetro `p_cliente` (valida que no venga vacío, igual que la cantidad).
- Formulario de Ventas ahora pide **Cliente** (obligatorio) además de producto/cantidad.
- Tabla de Ventas muestra la columna Cliente, y cada fila tiene un botón **"Ver comprobante"** que
  abre un modal con los datos de esa venta (cliente, producto, marca/presentación, cantidad, fecha,
  total) y un botón **Imprimir** — implementado con un área `#print-area` + CSS `@media print` en
  `index.css` que oculta el resto de la página al imprimir (patrón estándar, sin librerías extra).
- El usuario decidió explícitamente solo el comprobante individual (no una tabla adicional de ventas
  con cliente en Reportes).
- Verificado: `npx tsc -b`, `npm run build` y `npm run lint` limpios.

**No verificado aún:**
- El usuario no ha corrido `0004_sales_cliente.sql` en Supabase todavía, ni probado el flujo de venta
  con cliente / comprobante en el navegador.

**Pendiente / próximos pasos:**
1. ~~El usuario debe correr `0004_sales_cliente.sql`~~ — superada por la siguiente entrada: ahora hay
   que correr `0004` y `0005` en orden (`0005` depende de la columna `cliente` que crea `0004`).

---

## 2026-07-15 (continuación 4) — Ventas multi-producto por factura

**Pedido del usuario:** poder facturarle a un mismo cliente varios productos en una sola venta (no
una venta = un producto, como hasta ahora).

**Hecho:**
- Migración `0005_ventas_multilinea.sql`: nueva tabla `sale_invoices` (cabecera: cliente, fecha,
  total); `sales` pasa de "una venta completa" a "línea de una factura" (`sale_invoice_id`,
  product_id, cantidad, precio_unitario, subtotal — se le quitan `cliente`/`fecha`/`created_by`, que
  ahora viven en la cabecera). Incluye backfill: cada venta ya existente se convierte en una factura
  de una sola línea, sin perder datos.
- `registrar_venta` cambia de firma: ahora recibe `p_cliente` + `p_items` (un array JSON de
  `{product_id, cantidad}`), crea la factura y todas sus líneas en una sola transacción — si
  cualquier línea falla (producto no encontrado o stock insuficiente), se revierte TODA la factura,
  no solo esa línea. El mensaje de error ahora incluye el nombre del producto que falló.
- `useSales.ts` reemplazado por `useSaleInvoices.ts` (facturas con su lista de líneas embebida vía
  join anidado `sale_invoices → sales → products`); `useDashboardStats` actualizado para calcular
  `ventasCount`/`ventasTotal`/`unidadesVendidas` a partir de facturas en vez de líneas sueltas.
- `VentasPage` rediseñada con flujo tipo carrito: se arma la lista de productos+cantidades
  localmente (agregar/quitar líneas, si se agrega el mismo producto dos veces se suman las
  cantidades), se captura el cliente una sola vez, y se registra todo junto con un solo botón. La
  tabla de Ventas ahora lista facturas (cliente, resumen de productos, total, fecha), y el
  comprobante imprimible muestra todas las líneas de la factura con su propio subtotal y el total al
  final.
- Verificado: `npx tsc -b`, `npm run build` y `npm run lint` limpios.

**Bug encontrado por el usuario al probar:** la primera venta multi-producto ("German": cera
moldeadora x1, gel x2) se registró con las líneas correctas pero el **total en $0**.

**Causa raíz:** la migración `0005` habilitó RLS en `sale_invoices` con políticas de `select`/
`insert` pero se olvidó la de `update`. `registrar_venta()` (security invoker) inserta la cabecera
en $0 y al final del loop intenta `UPDATE ... SET total = ...` — sin política de update, Postgres
bloquea esa actualización silenciosamente (no lanza error, solo afecta 0 filas), así que el total
nunca se corrige aunque las líneas sí se insertan bien (por eso "cera moldeadora x1, gel x2" se veía
correcto).

**Hecho:**
- Migración `0006_sale_invoices_update_policy.sql`: agrega la política `sale_invoices_update` que
  faltaba.
- Se le dio al usuario una consulta de un solo uso para recalcular el total de facturas ya varadas
  en $0 (`update sale_invoices set total = (select sum(subtotal) from sales where sale_invoice_id =
  ...) where total = 0`).

**Verificado por el usuario:** migración `0006` corrida y consulta de ajuste puntual aplicada — el
total de la factura "German" y de ventas nuevas ya se calculan correctamente.

**Pendiente / próximos pasos:**
1. Probar que si un producto del carrito no tiene stock suficiente, toda la venta se rechaza (no se
   registra a medias) y el error menciona el producto que falló — aún no probado explícitamente.
2. Seguir con el resto del flujo pendiente (alertas de stock bajo, alta de un segundo usuario) y con
   la decisión de hosting para el despliegue a un dominio.

---

## 2026-07-15 (continuación 5) — Validación de stock y filtro de fechas en Ventas

**Hecho (ambos son cambios de frontend, sin migraciones):**
- Al agregar un producto al carrito en Ventas, se valida que la cantidad (sumada a lo que ya esté en
  el carrito de ese mismo producto) no supere el stock disponible; si lo supera, muestra un mensaje y
  no lo agrega.
- El selector de producto en Ventas ahora solo lista productos activos **y con stock > 0**.
- La tabla de Ventas tiene filtros **Fecha inicial**/**Fecha final** (por defecto ambas en el día de
  hoy, en hora local), y solo muestra facturas dentro de ese rango.
- Verificado: `npx tsc -b`, `npm run build` y `npm run lint` limpios en cada cambio.

**Pendiente / próximos pasos:**
1. Probar en el navegador: intentar agregar más cantidad que el stock disponible, confirmar que
   productos sin stock/inactivos no aparecen en el selector, y que el filtro de fechas funciona
   (por defecto solo hoy, cambiar el rango trae ventas de otros días).
2. Probar el caso de stock insuficiente a nivel de servidor en una venta multi-producto (aunque ahora
   hay validación en el cliente, la RPC sigue siendo la última línea de defensa).
3. Seguir con el resto del flujo pendiente (alertas de stock bajo, alta de un segundo usuario) y con
   la decisión de hosting para el despliegue a un dominio.

---

## 2026-07-15 (continuación 6) — Encabezados/total en Ventas + Observación y filtros en Salidas

**Hecho:**
- Tabla de Ventas: se agregaron encabezados de columna (Cliente, Productos, Total, Fecha, Acciones) y
  una fila de total al pie que suma **solo las facturas dentro del rango de fechas filtrado**.
- El usuario pidió eliminar todo el historial de movimientos/ventas de prueba pero decidió dejarlo
  como está por ahora mientras se siguen haciendo ajustes (se le dejó listo un script `DELETE FROM
  sales/sale_invoices/movements` sin aplicar, que no toca `products` ni `profiles` ni resetea stock).
- Migración `0007_salidas_observacion.sql`: columna `observacion` en `movements` (nullable a nivel de
  tabla), y `registrar_salida` ahora exige `p_observacion` no vacío (mismo patrón que `cliente` en
  ventas) — solo aplica a Salidas, Entradas/Ventas no la usan.
- `SalidasPage`: nuevo campo **Observación** obligatorio en el formulario; historial de salidas con
  encabezados de columna (Producto, Observación, Cantidad, Fecha) y filtros **Fecha inicial/Final**
  (mismo patrón que Ventas, por defecto el día de hoy).
- Verificado: `npx tsc -b`, `npm run build` y `npm run lint` limpios.

**Verificado por el usuario:** migración `0007` corrida y probada en el navegador — Observación
obligatoria, encabezados e historial de Salidas, y filtro de fechas, todo funcionando bien.

**Pendiente / próximos pasos:**
1. Sigue pendiente el script de limpieza de movimientos/ventas (a la espera de que el usuario decida
   correrlo), el caso de stock insuficiente en venta multi-producto, alertas de stock bajo, alta de un
   segundo usuario, y la decisión de hosting para el despliegue a un dominio.

---

## 2026-07-22 — Preparación para despliegue en Render

**Pedido del usuario:** dejar el repo listo para desplegar en Render (ya publicado en GitHub,
`shermans93/RudosBarber`).

**Hecho:**
- `render.yaml` en la raíz del repo: define un Static Site (`env: static`) con `rootDir: app`,
  `buildCommand: npm install && npm run build`, `staticPublishPath: ./dist`, y dos env vars
  declaradas sin valor (`sync: false`) para que Render pida `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_ANON_KEY` al crear el servicio desde el Blueprint.
- `app/.node-version` (`22.12.0`) y `engines.node` (`>=20.19.0`) en `app/package.json`: Vite 8
  requiere Node `^20.19.0 || >=22.12.0`; sin pin, el runtime por defecto de Render podía ser más
  viejo y romper el build.
- No se tocó el enrutamiento: `HashRouter` ya evita necesitar reglas de rewrite/redirect en el
  hosting (confirmado en `App.tsx`), así que no se agregó ninguna a `render.yaml`.
- Verificado localmente: `npm run build` (desde `app/`) compila y genera `dist/` sin errores
  (único warning cosmético: el bundle JS de ~516 kB supera el límite default de aviso de Vite —
  no es un error, no se atacó code-splitting por no ser parte de este pedido).

**Pendiente / próximos pasos:**
1. El usuario debe crear el servicio en Render (Blueprint desde `render.yaml`, o manual apuntando
   a `app/` como Root Directory) y cargar ahí las credenciales reales de Supabase — instrucciones
   paso a paso dadas en el chat, no repetidas aquí porque no son parte del repo.
2. Sigue pendiente lo de sesiones anteriores: script de limpieza de movimientos/ventas de prueba,
   caso de stock insuficiente en venta multi-producto, alertas de stock bajo, alta de un segundo
   usuario.

<!-- Nueva entrada: copiar el bloque de arriba (## AAAA-MM-DD, Hecho, Pendiente) y completarlo. -->
