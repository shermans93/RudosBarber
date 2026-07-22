import { useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, EmptyState } from '../components/ui/Card';
import { Table, Td, Th } from '../components/ui/Table';
import { SelectField, TextField } from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useProducts } from '../hooks/useProducts';
import { useRegistrarVenta, useSaleInvoices, type SaleInvoiceRow } from '../hooks/useSaleInvoices';
import { dateInputValue, fmtCOP, fmtFecha, isoToDateInputValue } from '../utils/format';

interface CartLine {
  productId: number;
  descripcion: string;
  precioVenta: number;
  cantidad: number;
}

export function VentasPage() {
  const { data: products = [] } = useProducts();
  const { data: invoices = [] } = useSaleInvoices();
  const registrarVenta = useRegistrarVenta();

  const [cliente, setCliente] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [lineProductId, setLineProductId] = useState('');
  const [lineCantidad, setLineCantidad] = useState('');
  const [lineError, setLineError] = useState('');
  const [receipt, setReceipt] = useState<SaleInvoiceRow | null>(null);
  const [fechaInicial, setFechaInicial] = useState(() => dateInputValue(new Date()));
  const [fechaFinal, setFechaFinal] = useState(() => dateInputValue(new Date()));

  const activeProducts = products.filter((p) => p.activo && p.stock > 0);
  const cartTotal = cart.reduce((acc, l) => acc + l.cantidad * l.precioVenta, 0);

  const invoicesEnRango = invoices.filter((inv) => {
    const f = isoToDateInputValue(inv.fecha);
    return (!fechaInicial || f >= fechaInicial) && (!fechaFinal || f <= fechaFinal);
  });

  function handleAddLine(e: FormEvent) {
    e.preventDefault();
    setLineError('');
    const pid = Number(lineProductId);
    const qty = Number(lineCantidad);
    const product = activeProducts.find((p) => p.id === pid);
    if (!product || !qty || qty <= 0) return;

    const yaEnCarrito = cart.find((l) => l.productId === pid)?.cantidad ?? 0;
    if (yaEnCarrito + qty > product.stock) {
      setLineError(
        `Solo hay ${product.stock} unidades disponibles de "${product.descripcion}"` +
          (yaEnCarrito > 0 ? ` (ya agregaste ${yaEnCarrito} al carrito).` : '.')
      );
      return;
    }

    setCart((c) => {
      const existing = c.find((l) => l.productId === pid);
      if (existing) {
        return c.map((l) => (l.productId === pid ? { ...l, cantidad: l.cantidad + qty } : l));
      }
      return [
        ...c,
        { productId: pid, descripcion: product.descripcion, precioVenta: product.precio_venta, cantidad: qty },
      ];
    });
    setLineProductId('');
    setLineCantidad('');
  }

  function removeLine(productId: number) {
    setLineError('');
    setCart((c) => c.filter((l) => l.productId !== productId));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cliente.trim() || cart.length === 0) return;
    registrarVenta.mutate(
      {
        cliente: cliente.trim(),
        items: cart.map((l) => ({ productId: l.productId, cantidad: l.cantidad })),
      },
      {
        onSuccess: () => {
          setCliente('');
          setCart([]);
        },
      }
    );
  }

  return (
    <>
      <Card className="p-6 mb-6">
        <h3 className="font-display font-semibold text-base mt-0 mb-4.5">Registrar venta</h3>

        <div className="max-w-xs mb-5">
          <TextField
            label="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Nombre del cliente"
          />
        </div>

        <form onSubmit={handleAddLine} className="flex flex-wrap gap-3.5 items-end">
          <div className="flex-[2] min-w-[220px]">
            <SelectField
              label="Producto"
              value={lineProductId}
              onChange={(e) => setLineProductId(e.target.value)}
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
              value={lineCantidad}
              onChange={(e) => setLineCantidad(e.target.value)}
              placeholder="0"
            />
          </div>
          <Button type="submit" variant="ghost" className="h-[41px]">
            + Agregar producto
          </Button>
        </form>

        {lineError && (
          <div className="mt-3.5 bg-danger-bg text-danger-text text-[13px] px-3.5 py-2.5 rounded-[9px]">
            {lineError}
          </div>
        )}

        {cart.length > 0 && (
          <div className="mt-5 border border-card-border rounded-card overflow-hidden">
            <Table>
              <tbody>
                {cart.map((l) => (
                  <tr key={l.productId}>
                    <Td className="font-medium">{l.descripcion}</Td>
                    <Td className="text-center text-muted">x{l.cantidad}</Td>
                    <Td align="right" className="text-muted">
                      {fmtCOP(l.precioVenta)}
                    </Td>
                    <Td align="right" className="font-semibold">
                      {fmtCOP(l.cantidad * l.precioVenta)}
                    </Td>
                    <Td align="right">
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-3 py-1 text-xs"
                        onClick={() => removeLine(l.productId)}
                      >
                        Quitar
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="px-5 py-3 bg-input-bg flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-display font-bold text-lg">{fmtCOP(cartTotal)}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Button
            type="submit"
            className="mt-4.5"
            disabled={registrarVenta.isPending || cart.length === 0 || !cliente.trim()}
          >
            Registrar venta
          </Button>
        </form>

        {registrarVenta.isError && (
          <div className="mt-3.5 bg-danger-bg text-danger-text text-[13px] px-3.5 py-2.5 rounded-[9px]">
            {registrarVenta.error.message}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ventas</CardTitle>
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
        {invoicesEnRango.length > 0 ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Cliente</Th>
                  <Th>Productos</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Fecha</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {invoicesEnRango.map((inv) => (
                  <tr key={inv.id}>
                    <Td className="font-medium">{inv.cliente}</Td>
                    <Td className="text-muted">
                      {inv.items.map((it) => `${it.descripcion} x${it.cantidad}`).join(', ')}
                    </Td>
                    <Td align="right" className="font-semibold">
                      {fmtCOP(inv.total)}
                    </Td>
                    <Td align="right" className="text-muted">
                      {fmtFecha(inv.fecha)}
                    </Td>
                    <Td align="right">
                      <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setReceipt(inv)}>
                        Ver comprobante
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="px-5 py-3 bg-input-bg border-t border-card-border flex items-center justify-between">
              <span className="text-sm font-semibold">
                Total del rango ({invoicesEnRango.length} venta{invoicesEnRango.length === 1 ? '' : 's'})
              </span>
              <span className="font-display font-bold text-lg">
                {fmtCOP(invoicesEnRango.reduce((acc, inv) => acc + inv.total, 0))}
              </span>
            </div>
          </>
        ) : (
          <EmptyState>
            {invoices.length === 0
              ? 'Sin ventas registradas.'
              : 'No hay ventas en el rango de fechas seleccionado.'}
          </EmptyState>
        )}
      </Card>

      {receipt && (
        <Modal title="Comprobante de venta" onClose={() => setReceipt(null)}>
          <div id="print-area">
            <div className="text-center mb-5">
              <div className="font-display font-bold text-lg">RUDOS BARBER</div>
              <div className="text-xs text-muted">Comprobante de venta #{receipt.id}</div>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-4">
              <dt className="text-muted">Cliente</dt>
              <dd className="font-medium text-right">{receipt.cliente}</dd>
              <dt className="text-muted">Fecha</dt>
              <dd className="text-right">{fmtFecha(receipt.fecha)}</dd>
            </dl>
            <Table>
              <thead>
                <tr>
                  <Th>Producto</Th>
                  <Th align="right">Cant.</Th>
                  <Th align="right">Precio</Th>
                  <Th align="right">Subtotal</Th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((it) => (
                  <tr key={it.id}>
                    <Td className="font-medium">{it.descripcion}</Td>
                    <Td align="right">x{it.cantidad}</Td>
                    <Td align="right" className="text-muted">
                      {fmtCOP(it.precio_unitario)}
                    </Td>
                    <Td align="right" className="font-semibold">
                      {fmtCOP(it.subtotal)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="mt-4 pt-4 border-t border-row-border flex items-center justify-between">
              <span className="font-display font-semibold">Total</span>
              <span className="font-display font-bold text-xl">{fmtCOP(receipt.total)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 no-print">
            <Button variant="ghost" onClick={() => setReceipt(null)}>
              Cerrar
            </Button>
            <Button onClick={() => window.print()}>Imprimir</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
