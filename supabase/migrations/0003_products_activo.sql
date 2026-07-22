-- =========================================================
-- 0003_products_activo.sql — soft-delete de productos
--
-- Un producto solo puede eliminarse (DELETE) si nunca tuvo movimientos:
-- la FK `movements.product_id references products(id) on delete restrict`
-- (y la misma en `sales`) ya bloquea a nivel de base de datos el borrado
-- de un producto con historial. Para productos con historial, la UI
-- ofrece "Inactivar" en su lugar, que solo apaga esta bandera.
-- =========================================================

alter table public.products
  add column activo boolean not null default true;
