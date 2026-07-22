import { useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, EmptyState } from '../components/ui/Card';
import { Table, Td } from '../components/ui/Table';
import { SelectField, TextField } from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import { useProducts } from '../hooks/useProducts';
import { useMovements, useRegistrarEntrada } from '../hooks/useMovements';
import { fmtFecha } from '../utils/format';

export function EntradasPage() {
  const { data: products = [] } = useProducts();
  const { data: movements = [] } = useMovements();
  const registrarEntrada = useRegistrarEntrada();
  const [productId, setProductId] = useState('');
  const [cantidad, setCantidad] = useState('');

  const entradas = movements.filter((m) => m.tipo === 'Entrada');
  const activeProducts = products.filter((p) => p.activo);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const pid = Number(productId);
    const qty = Number(cantidad);
    if (!pid || !qty || qty <= 0) return;
    registrarEntrada.mutate(
      { productId: pid, cantidad: qty },
      {
        onSuccess: () => {
          setProductId('');
          setCantidad('');
        },
      }
    );
  }

  return (
    <>
      <Card className="p-6 mb-6">
        <h3 className="font-display font-semibold text-base mt-0 mb-4.5">Registrar entrada</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3.5 items-end">
          <div className="flex-[2] min-w-[220px]">
            <SelectField
              label="Producto"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Selecciona un producto</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.descripcion}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="flex-1 min-w-[120px]">
            <TextField
              label="Cantidad"
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
            />
          </div>
          <Button type="submit" className="h-[41px]" disabled={registrarEntrada.isPending}>
            Registrar entrada
          </Button>
        </form>
        {registrarEntrada.isError && (
          <div className="mt-3.5 bg-danger-bg text-danger-text text-[13px] px-3.5 py-2.5 rounded-[9px]">
            {registrarEntrada.error.message}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de entradas</CardTitle>
        </CardHeader>
        {entradas.length > 0 ? (
          <Table>
            <tbody>
              {entradas.map((m) => (
                <tr key={m.id}>
                  <Td className="font-medium">{m.descripcion}</Td>
                  <Td align="right" className="text-success-text font-semibold">
                    +{m.cantidad}
                  </Td>
                  <Td align="right" className="text-muted">
                    {fmtFecha(m.fecha)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>Sin entradas registradas.</EmptyState>
        )}
      </Card>
    </>
  );
}
