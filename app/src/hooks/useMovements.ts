import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { PRODUCTS_KEY } from './useProducts';
import type { MovementType } from '../types/database.types';

export const MOVEMENTS_KEY = ['movements'] as const;

export interface MovementRow {
  id: number;
  tipo: MovementType;
  product_id: number;
  cantidad: number;
  observacion: string | null;
  fecha: string;
  descripcion: string;
}

interface MovementQueryRow {
  id: number;
  tipo: MovementType;
  product_id: number;
  cantidad: number;
  observacion: string | null;
  fecha: string;
  products: { descripcion: string } | null;
}

export function useMovements() {
  return useQuery({
    queryKey: MOVEMENTS_KEY,
    queryFn: async (): Promise<MovementRow[]> => {
      const { data, error } = await supabase
        .from('movements')
        .select('id, tipo, product_id, cantidad, observacion, fecha, products(descripcion)')
        .order('fecha', { ascending: false })
        .returns<MovementQueryRow[]>();
      if (error) throw error;
      return data.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        product_id: m.product_id,
        cantidad: m.cantidad,
        observacion: m.observacion,
        fecha: m.fecha,
        descripcion: m.products?.descripcion ?? '—',
      }));
    },
  });
}

interface RegistrarEntradaInput {
  productId: number;
  cantidad: number;
}

export function useRegistrarEntrada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, cantidad }: RegistrarEntradaInput) => {
      const { error } = await supabase.rpc('registrar_entrada', {
        p_product_id: productId,
        p_cantidad: cantidad,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_KEY });
    },
  });
}

interface RegistrarSalidaInput {
  productId: number;
  cantidad: number;
  observacion: string;
}

export function useRegistrarSalida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, cantidad, observacion }: RegistrarSalidaInput) => {
      const { error } = await supabase.rpc('registrar_salida', {
        p_product_id: productId,
        p_cantidad: cantidad,
        p_observacion: observacion,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_KEY });
    },
  });
}
