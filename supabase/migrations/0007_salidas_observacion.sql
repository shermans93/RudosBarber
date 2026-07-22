-- =========================================================
-- 0007_salidas_observacion.sql — observación obligatoria en Salidas
--
-- `observacion` se agrega a `movements` en general (columna nullable,
-- ya que Entradas y Ventas no la usan), pero `registrar_salida` exige
-- que no venga vacía — mismo patrón que la validación de `cliente` en
-- registrar_venta.
-- =========================================================

alter table public.movements
  add column observacion text;

drop function if exists public.registrar_salida(bigint, integer);

create or replace function public.registrar_salida(p_product_id bigint, p_cantidad integer, p_observacion text)
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

  if trim(p_observacion) = '' then
    raise exception 'Debes indicar una observación.';
  end if;

  update public.products
     set stock = stock - p_cantidad
   where id = p_product_id
     and stock >= p_cantidad
   returning stock into v_new_stock;

  if not found then
    raise exception 'Stock insuficiente para esta salida.';
  end if;

  insert into public.movements (tipo, product_id, cantidad, observacion, created_by)
  values ('Salida', p_product_id, p_cantidad, trim(p_observacion), auth.uid())
  returning * into v_movement;

  return v_movement;
end;
$$;

grant execute on function public.registrar_salida(bigint, integer, text) to authenticated;
