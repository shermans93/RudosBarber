-- =========================================================
-- 0002_rpc_movimientos.sql — RPC transaccional entrada/salida/venta
--
-- El chequeo de stock suficiente y la actualización se hacen en una
-- sola sentencia UPDATE ... WHERE stock >= cantidad, evitando la
-- condición de carrera de "leer stock, comparar en el cliente, luego
-- escribir". El INSERT del movimiento/venta ocurre en la misma
-- transacción implícita de la función: o se aplican ambos cambios, o
-- ninguno.
-- =========================================================

create or replace function public.registrar_entrada(p_product_id bigint, p_cantidad integer)
returns public.movements
language plpgsql
security invoker
as $$
declare
  v_movement public.movements;
begin
  if p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero.';
  end if;

  update public.products
     set stock = stock + p_cantidad
   where id = p_product_id;

  if not found then
    raise exception 'Producto % no encontrado.', p_product_id;
  end if;

  insert into public.movements (tipo, product_id, cantidad, created_by)
  values ('Entrada', p_product_id, p_cantidad, auth.uid())
  returning * into v_movement;

  return v_movement;
end;
$$;

create or replace function public.registrar_salida(p_product_id bigint, p_cantidad integer)
returns public.movements
language plpgsql
security invoker
as $$
declare
  v_movement public.movements;
  v_new_stock integer;
begin
  if p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero.';
  end if;

  update public.products
     set stock = stock - p_cantidad
   where id = p_product_id
     and stock >= p_cantidad
   returning stock into v_new_stock;

  if not found then
    raise exception 'Stock insuficiente para esta salida.';
  end if;

  insert into public.movements (tipo, product_id, cantidad, created_by)
  values ('Salida', p_product_id, p_cantidad, auth.uid())
  returning * into v_movement;

  return v_movement;
end;
$$;

create or replace function public.registrar_venta(p_product_id bigint, p_cantidad integer)
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

  insert into public.sales (product_id, cantidad, total, created_by)
  values (p_product_id, p_cantidad, p_cantidad * v_precio, auth.uid())
  returning * into v_sale;

  insert into public.movements (tipo, product_id, cantidad, created_by)
  values ('Venta', p_product_id, p_cantidad, auth.uid());

  return v_sale;
end;
$$;

grant execute on function public.registrar_entrada(bigint, integer) to authenticated;
grant execute on function public.registrar_salida(bigint, integer)  to authenticated;
grant execute on function public.registrar_venta(bigint, integer)   to authenticated;
