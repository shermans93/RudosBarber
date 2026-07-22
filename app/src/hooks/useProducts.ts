import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Product } from '../types/database.types';

export const PRODUCTS_KEY = ['products'] as const;

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export interface NewProductInput {
  descripcion: string;
  marca: string;
  presentacion: string;
  stockInicial: number;
  stockMinimo: number;
  precioVenta: number;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewProductInput) => {
      const { error } = await supabase.from('products').insert({
        descripcion: input.descripcion,
        marca: input.marca,
        presentacion: input.presentacion,
        stock: input.stockInicial,
        stock_minimo: input.stockMinimo,
        precio_venta: input.precioVenta,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export interface EditProductInput {
  id: number;
  descripcion: string;
  marca: string;
  presentacion: string;
  stockMinimo: number;
  precioVenta: number;
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EditProductInput) => {
      const { error } = await supabase
        .from('products')
        .update({
          descripcion: input.descripcion,
          marca: input.marca,
          presentacion: input.presentacion,
          stock_minimo: input.stockMinimo,
          precio_venta: input.precioVenta,
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

/**
 * Borra el producto. Solo puede tener éxito si nunca tuvo movimientos —
 * la FK `movements.product_id` / `sales.product_id` (ON DELETE RESTRICT)
 * rechaza el borrado a nivel de base de datos en ese caso. La UI debe
 * verificar de antemano (con la lista de movimientos ya cargada) si
 * corresponde ofrecer "Eliminar" o "Inactivar", pero este mutation deja
 * que la base de datos sea la fuente de verdad final.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useSetProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => {
      const { error } = await supabase.from('products').update({ activo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}
