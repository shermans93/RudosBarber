-- =========================================================
-- 0006_sale_invoices_update_policy.sql — corrige el total en $0
--
-- 0005 creó `sale_invoices` con políticas de select/insert pero no de
-- update, y registrar_venta() (security invoker) necesita actualizar
-- `total` justo después de insertar la cabecera. Sin esta política la
-- actualización se bloquea silenciosamente por RLS y el total se queda
-- en el valor por defecto (0), aunque las líneas se inserten bien.
-- =========================================================

create policy "sale_invoices_update" on public.sale_invoices
  for update to authenticated using (true) with check (true);
