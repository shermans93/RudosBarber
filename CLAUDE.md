# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session continuity

`BITACORA.md` (in this same directory) is a running log of what has been done in previous
sessions, decisions made, and pending next steps. At the start of a session, read it to pick up
where things left off. At the end of a session with meaningful work (or when asked), append a new
dated entry summarizing what changed and what remains open — do not rewrite prior entries.

## What this repository is

**"RUDOS BARBER Inventario"** is a real web app for barbershop inventory management: products,
stock entries/exits, sales, low-stock alerts, and a users screen. It has three parts:

- `app/` — the live application: **Vite + React + TypeScript** SPA. This is what you build, run,
  and edit for any feature work.
- `supabase/migrations/` — the Postgres schema and business-logic functions for the **Supabase**
  backend (Auth + Postgres + RLS). No server code of our own exists — the SPA talks to Supabase
  directly from the browser.
- `_diseno_extraido/` — the original static design prototype (a `.dc.html` file + its `support.js`
  runtime) that `app/` was built from. It is a **design reference only**, not part of the running
  app, and is never executed or edited — see "Design reference" below if you need to check original
  look-and-feel or copy.

## Commands

All commands run from `app/`:

```
npm install       # install dependencies
npm run dev       # start the dev server (Vite, default http://localhost:5173)
npm run build     # tsc -b (typecheck) + vite build (production bundle)
npm run lint      # oxlint
npx tsc -b        # typecheck only, no bundling
```

There is no test suite yet. Supabase migrations are plain SQL files under `supabase/migrations/`
(`0001_init.sql`, `0002_rpc_movimientos.sql`, ...) — apply new ones by pasting into the Supabase
dashboard's SQL Editor (or `supabase db push` if the Supabase CLI is linked to the project), in
filename order.

## Architecture

**Editing/removing products:** products have an `activo` boolean (`supabase/migrations/0003_products_activo.sql`,
default `true`). A product can only be hard-deleted (`useDeleteProduct`) if it has zero rows in
`movements` — enforced by the `on delete restrict` FK, not just checked client-side — otherwise the
UI offers "Inactivar" (`useSetProductActive`) instead. Inactive products stay visible (dimmed, with
an "Inactivo" badge) in the Productos catalog for historical/reporting purposes, but are filtered
out of the product `<select>` in Entradas/Salidas/Ventas so new movements can't target them. Editing
a product (`useUpdateProduct`) never touches `stock` — stock changes stay exclusively in
Entradas/Salidas/Ventas to preserve the movement audit trail.

**Auth:** Supabase Auth (email + password) is the identity provider, but the UI never shows an
email field — the login/user-creation forms ask for a short **"usuario"**, and the client
synthesizes `usuario@rudosbarber.local` internally (see `usuarioToEmail()` in
`app/src/lib/supabaseClient.ts`). `profiles` (a table keyed by `auth.users.id`) stores the
user-facing `usuario`/`nombre`/`rol` and is auto-populated by a `handle_new_user()` trigger on
`auth.users` insert (`supabase/migrations/0001_init.sql`). `AuthContext`
(`app/src/context/AuthContext.tsx`) exposes `session`/`profile`/`login()`/`logout()`.

Creating a new user (Usuarios screen) uses a **second, non-persistent Supabase client**
(`app/src/lib/supabaseSignupClient.ts`, `persistSession: false`) to call `signUp()` — using the
main client there would replace the admin's active session with the new user's.

**Stock movements are never mutated directly from the client.** Entradas/Salidas call Postgres RPC
functions (`registrar_entrada`, `registrar_salida` in `supabase/migrations/0002_rpc_movimientos.sql`,
`registrar_salida` later gaining a required `p_observacion` param in `0007_salidas_observacion.sql`)
via `supabase.rpc(...)`. Each does the stock check-and-decrement
(`UPDATE products SET stock = stock - cantidad WHERE stock >= cantidad`) and the `movements` insert
in one atomic transaction, and raises a Postgres exception ("Stock insuficiente para esta salida.",
"Debes indicar una observación.") that the client surfaces verbatim as the form error. Do not
replace these with two separate client-side calls (`update` then `insert`) — that reintroduces the
race condition and non-atomicity the RPCs exist to prevent. `movements.observacion` is nullable at
the table level (Entradas/Ventas don't set it) but enforced non-empty by `registrar_salida` itself.

**RLS trap for RPCs that update after insert:** these `security invoker` functions run as the
calling user, so every statement they execute — including a follow-up `UPDATE` after an `INSERT`
inside the same function — is still subject to that table's RLS policies. `0005_ventas_multilinea.sql`
added `select`/`insert` policies for `sale_invoices` but no `update` policy; `registrar_venta` inserts
the invoice header at `total = 0` then updates it after summing line items, so the update was
silently blocked (0 rows affected, no exception) and every invoice total stuck at `$0` even though
its line items were correct. Fixed by `0006_sale_invoices_update_policy.sql`. When adding a new RPC
that mutates a row after creating it, add the matching RLS policy in the same migration.

**Ventas are invoices with one or more line items.** `sale_invoices` (cliente, fecha, total) is the
header; `sales` (`supabase/migrations/0005_ventas_multilinea.sql`) holds one row per product line
(product_id, cantidad, precio_unitario, subtotal) referencing it. `registrar_venta(p_cliente, p_items
jsonb)` takes the whole cart as a JSON array of `{product_id, cantidad}` and, in one transaction:
creates the invoice header, loops the items doing the same atomic stock check-and-decrement as
entradas/salidas, inserts each `sales` line and a matching `movements` row, and updates the invoice
`total`. If any line fails (bad product, insufficient stock), the entire invoice rolls back — nothing
partial is left. `VentasPage` builds the cart client-side (`useState<CartLine[]>`) before submitting
it as a single `useRegistrarVenta` call; there is no per-line "registrar venta" RPC.

**Data/state:** TanStack Query (`@tanstack/react-query`). Each entity has a `use<Entity>()` query
hook and `use<Action>()` mutation hook under `app/src/hooks/`; mutations `invalidateQueries` on the
affected entity keys (`PRODUCTS_KEY`, `MOVEMENTS_KEY`, `SALE_INVOICES_KEY`, `PROFILES_KEY`) in
`onSuccess`. `useDashboardStats()` derives dashboard/report totals (low-stock list, inventory value,
sales totals) from the already-cached products/movements/sale-invoices queries — it does not issue
new queries.

**Routing:** `react-router-dom` with `HashRouter` (static-hosting friendly — no server rewrite rules
needed once deployed). `AppLayout` (Sidebar + Header + `<Outlet/>`) wraps all authenticated routes;
`RequireAuth`/`RedirectIfAuthed` in `App.tsx` gate access based on `useAuth().session`.

**Styling:** Tailwind CSS v4 (CSS-first config — no `tailwind.config.js`; tokens are declared as
`@theme` in `app/src/index.css`: `bg`, `ink`, `sidebar`, `accent`, `card-border`, etc., mapped from
the prototype's palette). `font-display` (Space Grotesk) is used for headings, matching the original.

**Row Level Security:** single-tenant — any authenticated user can read/write `products`,
`movements`, `sales`; `movements`/`sales` only allow `select`/`insert` (append-only log, no
update/delete). See the policies in `0001_init.sql` before changing access rules.

**Deliberate deviations from the `_diseno_extraido` prototype** (do not "fix" these back to match
the prototype — they're intentional consequences of adding real auth/persistence):
- The Usuarios table no longer shows any password/clave column — Supabase Auth never exposes
  passwords, unlike the prototype's masked demo field.
- The login screen no longer shows live product/low-stock counts in the left panel — those require
  querying `products`/`movements`, which RLS blocks for unauthenticated (`anon`) requests.

## Design reference (`_diseno_extraido/`)

The original prototype is a single `.dc.html` file (custom template directives — `{{ expr }}`,
`<sc-if>`, `<sc-for>` — interpreted by the vendored `support.js` runtime) with all logic in a
`class Component extends DCLogic`, in-memory `state`, and a `renderVals()` view-model function. It
has no persistence and its login (`admin`/`admin123`) is plaintext demo-only. Consult it for
original copy/spacing/behavior, but never execute or edit it — `app/` is the real, evolving
implementation.

## Manual Supabase setup (one-time, per environment)

1. Create a project at https://supabase.com; store the DB password in a password manager, not the repo.
2. **Project Settings → API**: copy `Project URL` / `anon public key` into `app/.env.local` (see
   `app/.env.example`).
3. **SQL Editor**: run the files in `supabase/migrations/` in filename order (`0001_init.sql` through
   the highest-numbered one present) — later ones alter tables/functions created by earlier ones.
4. **Authentication → Providers → Email**: turn off "Confirm email" (agreed: no email confirmation
   flow for this internal tool).
5. **Authentication → Users → Add user**: create `admin@rudosbarber.local` with a chosen password —
   the trigger auto-creates its `profiles` row (`usuario = 'admin'`, `rol = 'Administrador'`), so it
   can log in with `admin` as the "usuario".
