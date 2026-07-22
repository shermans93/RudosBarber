import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { PRODUCTS_KEY } from './useProducts';
import { MOVEMENTS_KEY } from './useMovements';

export const SALE_INVOICES_KEY = ['sale_invoices'] as const;

export interface SaleInvoiceItem {
  id: number;
  product_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descripcion: string;
  marca: string;
  presentacion: string;
}

export interface SaleInvoiceRow {
  id: number;
  cliente: string;
  total: number;
  fecha: string;
  items: SaleInvoiceItem[];
}

interface SaleLineQueryRow {
  id: number;
  product_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  products: { descripcion: string; marca: string; presentacion: string } | null;
}

interface SaleInvoiceQueryRow {
  id: number;
  cliente: string;
  total: number;
  fecha: string;
  sales: SaleLineQueryRow[];
}

export function useSaleInvoices() {
  return useQuery({
    queryKey: SALE_INVOICES_KEY,
    queryFn: async (): Promise<SaleInvoiceRow[]> => {
      const { data, error } = await supabase
        .from('sale_invoices')
        .select(
          'id, cliente, total, fecha, sales(id, product_id, cantidad, precio_unitario, subtotal, products(descripcion, marca, presentacion))'
        )
        .order('fecha', { ascending: false })
        .returns<SaleInvoiceQueryRow[]>();
      if (error) throw error;
      return data.map((inv) => ({
        id: inv.id,
        cliente: inv.cliente,
        total: inv.total,
        fecha: inv.fecha,
        items: inv.sales.map((s) => ({
          id: s.id,
          product_id: s.product_id,
          cantidad: s.cantidad,
          precio_unitario: s.precio_unitario,
          subtotal: s.subtotal,
          descripcion: s.products?.descripcion ?? '—',
          marca: s.products?.marca ?? '',
          presentacion: s.products?.presentacion ?? '',
        })),
      }));
    },
  });
}

export interface CartItem {
  productId: number;
  cantidad: number;
}

interface RegistrarVentaInput {
  cliente: string;
  items: CartItem[];
}

export function useRegistrarVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cliente, items }: RegistrarVentaInput) => {
      const { error } = await supabase.rpc('registrar_venta', {
        p_cliente: cliente,
        p_items: items.map((i) => ({ product_id: i.productId, cantidad: i.cantidad })),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: SALE_INVOICES_KEY });
    },
  });
}
