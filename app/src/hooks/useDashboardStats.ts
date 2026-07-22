import { useMemo } from 'react';
import { useProducts } from './useProducts';
import { useMovements, type MovementRow } from './useMovements';
import { useSaleInvoices, type SaleInvoiceRow } from './useSaleInvoices';
import type { Product } from '../types/database.types';

export function isLowStock(p: Product): boolean {
  return p.stock <= p.stock_minimo;
}

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_MOVEMENTS: MovementRow[] = [];
const EMPTY_INVOICES: SaleInvoiceRow[] = [];

export function useDashboardStats() {
  const productsQuery = useProducts();
  const movementsQuery = useMovements();
  const invoicesQuery = useSaleInvoices();

  const products = productsQuery.data ?? EMPTY_PRODUCTS;
  const movements = movementsQuery.data ?? EMPTY_MOVEMENTS;
  const invoices = invoicesQuery.data ?? EMPTY_INVOICES;

  const low = useMemo(() => products.filter(isLowStock), [products]);

  const valorInv = useMemo(
    () => products.reduce((acc, p) => acc + p.stock * p.precio_venta, 0),
    [products]
  );
  const ventasTotal = useMemo(() => invoices.reduce((acc, inv) => acc + inv.total, 0), [invoices]);
  const unidadesVendidas = useMemo(
    () => invoices.reduce((acc, inv) => acc + inv.items.reduce((a, it) => a + it.cantidad, 0), 0),
    [invoices]
  );

  const recentMoves = useMemo(() => movements.slice(0, 6), [movements]);

  return {
    isLoading: productsQuery.isLoading || movementsQuery.isLoading || invoicesQuery.isLoading,
    products,
    movements,
    invoices,
    low,
    stats: {
      totalProd: products.length,
      valorInv,
      lowCount: low.length,
      ventasCount: invoices.length,
      ventasTotal,
      unidadesVendidas,
    },
    recentMoves,
  };
}
