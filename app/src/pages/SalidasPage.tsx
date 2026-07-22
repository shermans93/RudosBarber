import { useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, EmptyState } from '../components/ui/Card';
import { Table, Td, Th } from '../components/ui/Table';
import { SelectField, TextField } from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import { useProducts } from '../hooks/useProducts';
import { useMovements, useRegistrarSalida } from '../hooks/useMovements';
import { dateInputValue, fmtFecha, isoToDateInputValue } from '../utils/format';

export function SalidasPage() {
  const { data: products = [] } = useProducts();
  const { data: movements = [] } = useMovements();
  const registrarSalida = useRegistrarSalida();
  const [productId, setProductId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [observacion, setObservacion] = useState('');
  const [fechaInicial, setFechaInicial] = useState(() => dateInputValue(new Date()));
  const [fechaFinal, setFechaFinal] = useState(() => dateInputValue(new Date()));

  const salidas = movements.filter((m) => m.tipo === 'Salida');
  const salidasEnRango = salidas.filter((m) => {
    const f = isoToDateInputValue(m.fecha);
    return (!fechaInicial || f >= fechaInicial) && (!fechaFinal || f <= fechaFinal);
  });
  const activeProducts = products.filter((p) => p.activo);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const pid = Number(productId);
    const qty = Number(cantidad);
    if (!pid || !qty || qty <= 0 || !observacion.trim()) return;
    registrarSalida.mutate(
      { productId: pid, cantidad: qty, observacion: observacion.trim() },
      {
        onSuccess: () => {
          setProductId('');
          setCantidad('');
          setObservacion('');
        },
      }
    );
  }

  return (
    <>
      <Card className="p-6 mb-6">
        <h3 className="font-display font-semibold text-base mt-0 mb-4.5">Registrar salida</h3>
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
          <div className="flex-[2] min-w-[220px]">
            <TextField
              label="Observación"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Motivo de la salida"
              required
            />
          </div>
          <Button type="submit" className="h-[41px]" disabled={registrarSalida.isPending}>
            Registrar salida
          </Button>
        </form>
        {registrarSalida.isError && (
          <div className="mt-3.5 bg-danger-bg text-danger-text text-[13px] px-3.5 py-2.5 rounded-[9px]">
            {registrarSalida.error.message}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de salidas</CardTitle>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-label mb-1.5">Fecha inicial</label>
              <input
                type="date"
                value={fechaInicial}
                onChange={(e) => setFechaInicial(e.target.value)}
                className="px-3 py-1.5 border border-input-border rounded-[10px] text-sm bg-input-bg focus:border-ink transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-label mb-1.5">Fecha final</label>
              <input
                type="date"
                value={fechaFinal}
                onChange={(e) => setFechaFinal(e.target.value)}
                className="px-3 py-1.5 border border-input-border rounded-[10px] text-sm bg-input-bg focus:border-ink transition-colors"
              />
            </div>
          </div>
        </CardHeader>
        {salidasEnRango.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th>Observación</Th>
                <Th align="right">Cantidad</Th>
                <Th align="right">Fecha</Th>
              </tr>
            </thead>
            <tbody>
              {salidasEnRango.map((m) => (
                <tr key={m.id}>
                  <Td className="font-medium">{m.descripcion}</Td>
                  <Td className="text-muted">{m.observacion || '—'}</Td>
                  <Td align="right" className="text-danger-text font-semibold">
                    −{m.cantidad}
                  </Td>
                  <Td align="right" className="text-muted">
                    {fmtFecha(m.fecha)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>
            {salidas.length === 0
              ? 'Sin salidas registradas.'
              : 'No hay salidas en el rango de fechas seleccionado.'}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
