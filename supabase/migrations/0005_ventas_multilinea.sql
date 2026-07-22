-- =========================================================
-- 0005_ventas_multilinea.sql — una venta (factura) admite varios
-- productos para el mismo cliente.
--
-- Se introduce `sale_invoices` como cabecera de la factura (cliente,
-- fecha, total, created_by); `sales` pasa de "una venta completa" a
-- "línea de una factura" (producto, cantidad, precio unitario,
-- subtotal). Los datos existentes se migran 1:1: cada venta antigua
-- se convierte en una factura de una sola línea.
-- =========================================================

create table public.sale_invoices (
  id         bigint generated always as identity primary key,
  cliente    text not null,
  total      numeric(12,2) not null default 0 check (total >= 0),
  fecha      timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index sale_invoices_fecha_idx on public.sale_invoices(fecha desc);

alter table public.sale_invoices enable row level security;
create policy "sale_invoices_select" on public.sale_invoices for select to authenticated using (true);
create policy "sale_invoices_insert" on public.sale_invoices for insert to authenticated with check (true);

-- --- Backfill: una factura de una sola línea por cada venta existente ---
alter table public.sale_invoices add column _migration_old_sale_id bigint;

insert into public.sale_invoices (cliente, total, fecha, created_by, _migration_old_sale_id)
select coalesce(nullif(cliente, ''), 'Cliente sin nombre'), total, fecha, created_by, id
from public.sales;

alter table public.sales add column sale_invoice_id bigint references public.sale_invoices(id) on delete cascade;

update public.sales s
set sale_invoice_id = si.id
from public.sale_invoices si
where si._migration_old_sale_id = s.id;

alter table public.sale_invoices drop column _migration_old_sale_id;

-- --- `sales` pasa de "una venta completa" a "línea de una factura" ---
alter table public.sales add column precio_unitario numeric(12,2);
update public.sales set precio_unitario = total / cantidad where precio_unitario is null;
alter table public.sales alter column precio_unitario set not null;

alter table public.sales rename column total to subtotal;
alter table public.sales alter column sale_invoice_id set not null;
alter table public.sales drop column cliente;
alter table public.sales drop column fecha;
alter table public.sales drop column created_by;

create index sales_sale_invoice_id_idx on public.sales(sale_invoice_id);

-- --- RPC: registra una factura con una o más líneas de forma atómica ---
-- Si cualquier línea falla (producto inexistente o stock insuficiente),
-- toda la función se revierte: no queda ni la factura ni ninguna línea
-- ni ningún descuento de stock a medias.
drop function if exists public.registrar_venta(bigint, integer, text);

create or replace function public.registrar_venta(p_cliente text, p_items jsonb)
returns public.sale_invoices
language plpgsql
security invoker
as $$
declare
  v_invoice public.sale_invoices;
  v_item record;
  v_precio numeric(12,2);
  v_descripcion text;
  v_new_stock integer;
  v_running_total numeric(12,2) := 0;
begin
  if trim(p_cliente) = '' then
    raise exception 'Debes indicar el cliente.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Debes agregar al menos un producto.';
  end if;

  insert into public.sale_invoices (cliente, created_by)
  values (trim(p_cliente), auth.uid())
  returning * into v_invoice;

  for v_item in
    select (x->>'product_id')::bigint as product_id, (x->>'cantidad')::integer as cantidad
    from jsonb_array_elements(p_items) as x
  loop
    if v_item.cantidad <= 0 then
      raise exception 'La cantidad debe ser mayor que cero.';
    end if;

    select precio_venta, descripcion into v_precio, v_descripcion
      from public.products
     where id = v_item.product_id
     for update;

    if not found then
      raise exception 'Producto % no encontrado.', v_item.product_id;
    end if;

    update public.products
       set stock = stock - v_item.cantidad
     where id = v_item.product_id
       and stock >= v_item.cantidad
     returning stock into v_new_stock;

    if not found then
      raise exception 'Stock insuficiente para "%" (solicitado: %).', v_descripcion, v_item.cantidad;
    end if;

    insert into public.sales (sale_invoice_id, product_id, cantidad, precio_unitario, subtotal)
    values (v_invoice.id, v_item.product_id, v_item.cantidad, v_precio, v_item.cantidad * v_precio);

    insert into public.movements (tipo, product_id, cantidad, created_by)
    values ('Venta', v_item.product_id, v_item.cantidad, auth.uid());

    v_running_total := v_running_total + (v_item.cantidad * v_precio);
  end loop;

  update public.sale_invoices set total = v_running_total where id = v_invoice.id
  returning * into v_invoice;

  return v_invoice;
end;
$$;

grant execute on function public.registrar_venta(text, jsonb) to authenticated;
