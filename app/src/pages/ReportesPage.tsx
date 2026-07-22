import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Table, Td, Th } from '../components/ui/Table';
import { supabase } from '../lib/supabaseClient';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { fmtCOP } from '../utils/format';
import type { InventoryValuationRow } from '../types/database.types';

export function ReportesPage() {
  const { stats } = useDashboardStats();

  const { data: valuation = [] } = useQuery({
    queryKey: ['inventory-valuation'],
    queryFn: async (): Promise<InventoryValuationRow[]> => {
      const { data, error } = await supabase
        .from('v_inventory_valuation')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4 mb-6.5">
        <KpiCard label="Valor de inventario" value={fmtCOP(stats.valorInv)} />
        <KpiCard label="Ingresos por ventas" value={fmtCOP(stats.ventasTotal)} />
        <KpiCard label="Unidades vendidas" value={stats.unidadesVendidas} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Valorización de inventario</CardTitle>
        </CardHeader>
        <Table>
          <thead>
            <tr>
              <Th>Producto</Th>
              <Th align="right">Stock</Th>
              <Th align="right">Precio</Th>
              <Th align="right">Subtotal</Th>
            </tr>
          </thead>
          <tbody>
            {valuation.map((row) => (
              <tr key={row.id}>
                <Td className="font-medium">{row.descripcion}</Td>
                <Td align="right">{row.stock}</Td>
                <Td align="right" className="text-muted">
                  {fmtCOP(row.precio_venta)}
                </Td>
                <Td align="right" className="font-semibold">
                  {fmtCOP(row.subtotal)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
