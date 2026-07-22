import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, EmptyState } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Table, Td, Th } from '../components/ui/Table';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { fmtCOP, fmtFecha } from '../utils/format';

const MOVEMENT_TONE = {
  Entrada: 'success',
  Salida: 'danger',
  Venta: 'accent',
} as const;

export function DashboardPage() {
  const { stats, low, recentMoves } = useDashboardStats();

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4 mb-7">
        <KpiCard label="Productos" value={stats.totalProd} />
        <KpiCard label="Valor de inventario" value={fmtCOP(stats.valorInv)} />
        <KpiCard label="Stock bajo" value={stats.lowCount} tone={stats.lowCount > 0 ? 'danger' : 'default'} />
        <KpiCard label="Ventas registradas" value={stats.ventasCount} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Alertas de stock bajo</CardTitle>
          <span className="text-xs text-muted">Productos en o por debajo del mínimo</span>
        </CardHeader>
        {low.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th>Marca</Th>
                <Th align="right">Stock</Th>
                <Th align="right">Mínimo</Th>
              </tr>
            </thead>
            <tbody>
              {low.map((p) => (
                <tr key={p.id}>
                  <Td className="font-medium">{p.descripcion}</Td>
                  <Td className="text-muted">{p.marca}</Td>
                  <Td align="right" className="text-danger-text font-semibold">
                    {p.stock}
                  </Td>
                  <Td align="right" className="text-muted">
                    {p.stock_minimo}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>Todo el inventario está por encima del mínimo. ✓</EmptyState>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos recientes</CardTitle>
        </CardHeader>
        {recentMoves.length > 0 ? (
          <Table>
            <tbody>
              {recentMoves.map((m) => (
                <tr key={m.id}>
                  <Td>
                    <Badge tone={MOVEMENT_TONE[m.tipo]}>{m.tipo}</Badge>
                  </Td>
                  <Td className="font-medium">{m.descripcion}</Td>
                  <Td align="right">
                    {m.tipo === 'Entrada' ? '+' : '−'}
                    {m.cantidad}
                  </Td>
                  <Td align="right" className="text-muted">
                    {fmtFecha(m.fecha)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>Aún no hay movimientos registrados.</EmptyState>
        )}
      </Card>
    </>
  );
}
