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

---

## 2026-07-22 (continuación) — Despliegue en Render resuelto + validaciones en Ventas + cambio de contraseña

**Despliegue en Render:** el usuario creó el Static Site. Dos problemas encontrados y resueltos
durante el primer deploy (no requirieron cambios en el repo, solo en la configuración del
dashboard de Render):
1. `Publish directory app/dist does not exist` — el usuario había puesto `app/dist` en Publish
   Directory con `Root Directory = app`, duplicando el prefijo (`app/app/dist`). Corregido a
   `dist` a secas.
2. Tras corregir eso, el login fallaba con `Invalid supabaseUrl`. Causa: `VITE_SUPABASE_URL` tenía
   pegada la URL del **Data API** (`https://<ref>.supabase.co/rest/v1/`) en vez de la URL base del
   proyecto. Corregido a `https://<ref>.supabase.co` sin sufijo. El sitio quedó funcionando en
   producción con login verificado por el usuario.

**Validaciones agregadas en Ventas (`VentasPage.tsx`), sin migraciones:**
- Si el campo Cliente está vacío y se intenta seleccionar un producto en el `<select>`, se bloquea
  la selección y se muestra "Debes indicar el nombre del cliente antes de seleccionar un producto."
  (la selección solo se confirma en el estado si `cliente` no está vacío; al ser un select
  controlado, si no se actualiza el estado el navegador revierte visualmente la selección).
- Al hacer clic en "+ Agregar producto": si no hay producto seleccionado, "Selecciona un
  producto."; si hay producto pero la cantidad es vacía/0/negativa, "Debes colocar la cantidad."
  (antes ambos casos fallaban en silencio, sin mensaje).

**Nueva función: cambiar contraseña de otro usuario (Usuarios screen).** El usuario pidió
explícitamente que el admin pudiera cambiar la clave de *cualquier* usuario (no solo la propia),
lo cual requiere la Admin API de Supabase Auth y por lo tanto la `service_role` key — esto no se
puede hacer solo desde el navegador con la anon key. Se agregó la primera pieza de backend propio
del proyecto:
- `supabase/functions/reset-password/index.ts`: Edge Function que recibe `{user_id, new_password}`,
  valida con el JWT del que llama (vía `Authorization` header, adjuntado automático por
  `supabase.functions.invoke`) que su `profiles.rol = 'Administrador'`, y si es así usa un cliente
  aparte con `SUPABASE_SERVICE_ROLE_KEY` (env var que Supabase inyecta solo, no se guarda en el
  repo) para llamar `auth.admin.updateUserById()`. Maneja CORS (preflight `OPTIONS` + headers).
- `useResetUserPassword()` en `app/src/hooks/useProfiles.ts` invoca la función vía
  `supabase.functions.invoke('reset-password', ...)`.
- `UsuariosPage.tsx`: columna "Acciones" con botón "Cambiar contraseña" por fila, abre
  `ChangePasswordModal` (nueva contraseña + confirmar, mínimo 6 caracteres, mensaje de éxito).
- `CLAUDE.md` actualizado: la afirmación "No server code of our own exists" ya no aplica tal cual;
  se agregó sección "Edge Functions" explicando el porqué (Admin API vs. anon key) y el patrón de
  despliegue (pegar en Dashboard → Edge Functions, sin CLI ni entorno local de Functions).
- Verificado: `npx tsc -b` y `npm run build` limpios. **No verificado aún:** la función no se ha
  desplegado en Supabase todavía (no hay `supabase/functions/` ni CLI vinculada localmente), así
  que el flujo de cambio de contraseña no se ha probado end-to-end.

**Pendiente / próximos pasos (superado, ver entrada siguiente):**
1. ~~El usuario debe desplegar `reset-password`~~ — hecho, ver entrada siguiente.
2. Commitear y pushear estos cambios a GitHub para que Render los tome — **todavía no hecho**,
   sigue pendiente (ver entrada siguiente).
3. Sigue pendiente de sesiones anteriores: caso de stock insuficiente en venta multi-producto,
   alertas de stock bajo, alta de un segundo usuario.

---

## 2026-07-22 (continuación 2) — Fix de `reset-password` + borrado total de datos de prueba

**Bug encontrado al probar `reset-password` end-to-end:** el usuario desplegó la función y probó
"Cambiar contraseña" en Usuarios; siempre devolvía `401` con `"Edge Function returned a non-2xx
status code"` (mensaje genérico del cliente de Supabase, no el real). Se depuró revisando
Invocations en el dashboard de Supabase (`response.status_code: 401`, con `sb.auth_user` presente
en el log — es decir, el JWT del que llama SÍ llegaba bien a la función).

**Causa raíz:** `callerClient.auth.getUser()` se llamaba **sin argumento**. El método `getUser()`
de supabase-js, si no recibe el JWT como parámetro explícito, ignora el header `Authorization`
que se le configuró al cliente (ese header solo aplica a las llamadas de PostgREST/Storage/
Functions, no a las internas de `auth-js`) y busca una sesión interna que no existe en un cliente
recién creado en el servidor — por eso siempre devolvía "Sesión inválida" (401), sin importar
quién llamara.

**Fix:** `supabase/functions/reset-password/index.ts` ahora extrae el bearer token del header
(`authHeader.replace(/^Bearer\s+/i, '')`) y se lo pasa explícitamente:
`callerClient.auth.getUser(bearerToken)`. El usuario repegó el archivo corregido en Supabase
Dashboard → Edge Functions → `reset-password` y redesplegó.

**Verificado por el usuario:** tras el redeploy, "Cambiar contraseña" en Usuarios funciona
end-to-end (modal muestra éxito, la nueva clave permite loguearse).

**Borrado total de datos de prueba.** El usuario pidió limpiar todas las tablas excepto usuarios;
al confirmar alcance, eligió **historial + catálogo de productos** (reset total), no solo el
historial transaccional. Se le entregó este script (no ejecutado por mí — sin acceso directo a la
base de datos, solo puedo generar SQL para que el usuario lo corra en el SQL Editor):
```sql
truncate table public.sales, public.sale_invoices, public.movements, public.products
  restart identity;
```
Listar las 4 tablas juntas en un solo `truncate` resuelve las referencias entre ellas sin
`cascade`; `restart identity` reinicia los IDs desde 1; no toca `profiles` ni `auth.users`. El
usuario confirmó haberlo corrido. **No verificado por mí ni explícitamente confirmado por el
usuario tras correrlo:** que Productos/Entradas/Salidas/Ventas se vean vacíos y que Usuarios siga
intacto en la UI — quedó pendiente de que el usuario revise esas 4 pantallas.

**Pendiente / próximos pasos (parcialmente superado, ver entrada siguiente):**
1. Confirmar visualmente que las 4 pantallas (Productos, Entradas, Salidas, Ventas) quedaron
   vacías y que Usuarios sigue con las cuentas y contraseñas funcionando.
2. ~~Commitear y pushear a GitHub~~ — hecho (commit `c1af977`, ver entrada de despliegue).
3. Sigue pendiente de sesiones anteriores: caso de stock insuficiente en venta multi-producto,
   alertas de stock bajo, alta de un segundo usuario.
4. Dar de alta productos de nuevo en el catálogo (quedó vacío tras el reset).

---

## 2026-07-22 (continuación 3) — Layout responsive para celular (menú hamburguesa)

**Reporte del usuario:** al abrir el sitio desde el celular, "no carga ninguna opción" — no se
veía el menú de navegación.

**Causa raíz:** la app nunca tuvo diseño responsive. `AppLayout.tsx` usaba `flex flex-wrap` con el
`Sidebar` de ancho fijo (`w-[246px]`) y `min-h-screen`. En pantallas angostas, el sidebar no cabe
junto al contenido y `flex-wrap` lo manda a su propia fila — pero como esa fila quedaba forzada a
ocupar el alto completo de la pantalla (`min-h-screen`), el usuario tenía que hacer scroll un
pantallazo completo (viendo solo una franja oscura angosta a la izquierda) antes de llegar al
header/contenido real. Por eso parecía que no cargaba nada.

**Fix — patrón de menú hamburguesa (afecta solo `app/src/components/layout/`, sin migraciones):**
- `AppLayout.tsx`: nuevo estado `mobileNavOpen`; cambia `flex-wrap` por `flex` simple, `main` pasa
  de `min-w-[320px]` a `min-w-0` (evita que el contenido fuerce scroll horizontal en pantallas
  angostas), padding del contenido reducido en móvil (`p-4 md:p-8`).
- `Sidebar.tsx`: ahora recibe `mobileOpen`/`onClose`. En móvil es un drawer fijo
  (`fixed inset-y-0 left-0`, `-translate-x-full` cuando cerrado) con un backdrop oscuro semi-
  transparente detrás que cierra al tocarlo; agrega un botón ✕ propio (visible solo en móvil,
  `md:hidden`). En `md:` (768px) y más ancho vuelve a comportarse como columna estática siempre
  visible (`md:static md:translate-x-0`), igual que antes. Cada `NavLink` ahora también cierra el
  drawer al navegar (`onClick={onClose}`). Se quitó `min-h-screen` (ya no hace falta: fijo ocupa
  toda la altura en móvil, y `flex`+`static` estira la altura en desktop).
- `Header.tsx`: nuevo botón ☰ (visible solo en móvil, `md:hidden`) que abre el drawer; padding
  horizontal reducido en móvil (`px-4 md:px-8`).
- Verificado: `npx tsc -b` y `npm run build` limpios. El usuario probó en local con DevTools en
  modo dispositivo móvil y confirmó que el menú funciona (☰ abre el drawer con backdrop, ✕/tocar
  fuera/navegar lo cierra).

**No verificado aún:** no se ha probado en un celular real (solo emulación de DevTools en local);
falta confirmar en producción (Render) desde el celular del usuario.

**Pendiente / próximos pasos:**
1. Commitear y pushear este cambio de layout responsive, y confirmar en el celular real del
   usuario una vez desplegado en Render.
2. Confirmar visualmente el borrado total de datos (Productos/Entradas/Salidas/Ventas vacíos,
   Usuarios intacto) — sigue pendiente de sesiones anteriores.
3. Sigue pendiente: caso de stock insuficiente en venta multi-producto, alertas de stock bajo,
   alta de un segundo usuario, dar de alta productos de nuevo en el catálogo.

<!-- Nueva entrada: copiar el bloque de arriba (## AAAA-MM-DD, Hecho, Pendiente) y completarlo. -->
