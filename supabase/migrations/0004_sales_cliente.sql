-- =========================================================
-- 0004_sales_cliente.sql — nombre del cliente en cada venta
--
-- registrar_venta cambia de firma (nuevo parámetro p_cliente), así que
-- se elimina la versión anterior antes de recrearla para no dejar un
-- overload viejo y ambiguo conviviendo con el nuevo.
-- =========================================================

alter table public.sales
  add column cliente text not null default '';

drop function if exists public.registrar_venta(bigint, integer);

create or replace function public.registrar_venta(p_product_id bigint, p_cantidad integer, p_cliente text)
returns public.sales
language plpgsql
security invoker
as $$
declare
  v_sale public.sales;
  v_precio numeric(12,2);
  v_new_stock integer;
begin
  if p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero.';
  end if;

  if trim(p_cliente) = '' then
    raise exception 'Debes indicar el cliente.';
  end if;

  select precio_venta into v_precio
    from public.products
   where id = p_product_id
   for update;

  if not found then
    raise exception 'Producto % no encontrado.', p_product_id;
  end if;

  update public.products
     set stock = stock - p_cantidad
   where id = p_product_id
     and stock >= p_cantidad
   returning stock into v_new_stock;

  if not found then
    raise exception 'Stock insuficiente para esta venta.';
  end if;

  insert into public.sales (product_id, cantidad, total, cliente, created_by)
  values (p_product_id, p_cantidad, p_cantidad * v_precio, trim(p_cliente), auth.uid())
  returning * into v_sale;

  insert into public.movements (tipo, product_id, cantidad, created_by)
  values ('Venta', p_product_id, p_cantidad, auth.uid());

  return v_sale;
end;
$$;

grant execute on function public.registrar_venta(bigint, integer, text) to authenticated;
