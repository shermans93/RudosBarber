import { useMemo, useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, Td, Th } from '../components/ui/Table';
import { TextField } from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useSetProductActive,
  useUpdateProduct,
} from '../hooks/useProducts';
import { useMovements } from '../hooks/useMovements';
import { isLowStock } from '../hooks/useDashboardStats';
import { fmtCOP } from '../utils/format';
import type { Product } from '../types/database.types';

const EMPTY_FORM = {
  descripcion: '',
  marca: '',
  presentacion: '',
  stockInicial: '',
  stockMinimo: '',
  precioVenta: '',
};

const EMPTY_EDIT_FORM = {
  descripcion: '',
  marca: '',
  presentacion: '',
  stockMinimo: '',
  precioVenta: '',
};

function productToEditForm(p: Product): typeof EMPTY_EDIT_FORM {
  return {
    descripcion: p.descripcion,
    marca: p.marca,
    presentacion: p.presentacion,
    stockMinimo: String(p.stock_minimo),
    precioVenta: String(p.precio_venta),
  };
}

export function ProductosPage() {
  const { data: products = [] } = useProducts();
  const { data: movements = [] } = useMovements();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const setActive = useSetProductActive();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [actionError, setActionError] = useState('');

  const productIdsWithMovements = useMemo(
    () => new Set(movements.map((m) => m.product_id)),
    [movements]
  );

  function handleChange(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.descripcion.trim()) return;
    createProduct.mutate(
      {
        descripcion: form.descripcion.trim(),
        marca: form.marca.trim(),
        presentacion: form.presentacion.trim(),
        stockInicial: Math.max(0, Number(form.stockInicial) || 0),
        stockMinimo: Math.max(0, Number(form.stockMinimo) || 0),
        precioVenta: Math.max(0, Number(form.precioVenta) || 0),
      },
      { onSuccess: () => setForm(EMPTY_FORM) }
    );
  }

  function openEdit(p: Product) {
    setEditing(p);
    setEditForm(productToEditForm(p));
  }

  function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing || !editForm.descripcion.trim()) return;
    updateProduct.mutate(
      {
        id: editing.id,
        descripcion: editForm.descripcion.trim(),
        marca: editForm.marca.trim(),
        presentacion: editForm.presentacion.trim(),
        stockMinimo: Math.max(0, Number(editForm.stockMinimo) || 0),
        precioVenta: Math.max(0, Number(editForm.precioVenta) || 0),
      },
      { onSuccess: () => setEditing(null) }
    );
  }

  function handleDelete(p: Product) {
    setActionError('');
    if (!window.confirm(`¿Eliminar "${p.descripcion}"? Esta acción no se puede deshacer.`)) return;
    deleteProduct.mutate(p.id, {
      onError: () =>
        setActionError(
          `No se pudo eliminar "${p.descripcion}": tiene movimientos registrados. Usa "Inactivar" en su lugar.`
        ),
    });
  }

  function handleToggleActive(p: Product) {
    setActionError('');
    setActive.mutate({ id: p.id, activo: !p.activo });
  }

  return (
    <>
      <Card className="p-6 mb-6">
        <h3 className="font-display font-semibold text-base mt-0 mb-4.5">Nuevo producto</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
            <TextField
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Ej. Cera moldeadora"
            />
            <TextField
              label="Marca"
              value={form.marca}
              onChange={(e) => handleChange('marca', e.target.value)}
              placeholder="Ej. Wahl"
            />
            <TextField
              label="Presentación"
              value={form.presentacion}
              onChange={(e) => handleChange('presentacion', e.target.value)}
              placeholder="Ej. Tarro 150g"
            />
            <TextField
              label="Stock inicial"
              type="number"
              min={0}
              value={form.stockInicial}
              onChange={(e) => handleChange('stockInicial', e.target.value)}
              placeholder="0"
            />
            <TextField
              label="Stock mínimo"
              type="number"
              min={0}
              value={form.stockMinimo}
              onChange={(e) => handleChange('stockMinimo', e.target.value)}
              placeholder="0"
            />
            <TextField
              label="Precio de venta"
              type="number"
              min={0}
              value={form.precioVenta}
              onChange={(e) => handleChange('precioVenta', e.target.value)}
              placeholder="0"
            />
          </div>
          <Button type="submit" className="mt-4.5" disabled={createProduct.isPending}>
            + Crear producto
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          <span className="text-xs text-muted">{products.length} productos</span>
        </CardHeader>

        {actionError && (
          <div className="mx-5 mt-4 bg-danger-bg text-danger-text text-[13px] px-3.5 py-2.5 rounded-[9px]">
            {actionError}
          </div>
        )}

        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Descripción</Th>
              <Th>Marca</Th>
              <Th>Presentación</Th>
              <Th align="right">Stock</Th>
              <Th align="right">Mín</Th>
              <Th align="right">Precio</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const hasMovements = productIdsWithMovements.has(p.id);
              return (
                <tr key={p.id} className={p.activo ? undefined : 'opacity-50'}>
                  <Td className="text-muted-2">#{p.id}</Td>
                  <Td className="font-medium">
                    {p.descripcion}
                    {!p.activo && (
                      <span className="ml-2">
                        <Badge tone="neutral">Inactivo</Badge>
                      </span>
                    )}
                  </Td>
                  <Td className="text-label">{p.marca}</Td>
                  <Td className="text-muted">{p.presentacion}</Td>
                  <Td align="right">
                    <span
                      className={
                        isLowStock(p)
                          ? 'text-accent font-bold bg-danger-bg px-2.5 py-0.5 rounded-full'
                          : 'font-medium'
                      }
                    >
                      {p.stock}
                    </span>
                  </Td>
                  <Td align="right" className="text-muted">
                    {p.stock_minimo}
                  </Td>
                  <Td align="right" className="font-medium">
                    {fmtCOP(p.precio_venta)}
                  </Td>
                  <Td align="right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => openEdit(p)}>
                        Editar
                      </Button>
                      {p.activo ? (
                        hasMovements ? (
                          <Button
                            variant="ghost"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => handleToggleActive(p)}
                          >
                            Inactivar
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            className="px-3 py-1.5 text-xs hover:border-danger-text! hover:text-danger-text!"
                            onClick={() => handleDelete(p)}
                          >
                            Eliminar
                          </Button>
                        )
                      ) : (
                        <Button
                          variant="ghost"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => handleToggleActive(p)}
                        >
                          Reactivar
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {editing && (
        <Modal title={`Editar "${editing.descripcion}"`} onClose={() => setEditing(null)}>
          <form onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
              <TextField
                label="Descripción"
                value={editForm.descripcion}
                onChange={(e) => setEditForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
              <TextField
                label="Marca"
                value={editForm.marca}
                onChange={(e) => setEditForm((f) => ({ ...f, marca: e.target.value }))}
              />
              <TextField
                label="Presentación"
                value={editForm.presentacion}
                onChange={(e) => setEditForm((f) => ({ ...f, presentacion: e.target.value }))}
              />
              <TextField
                label="Stock mínimo"
                type="number"
                min={0}
                value={editForm.stockMinimo}
                onChange={(e) => setEditForm((f) => ({ ...f, stockMinimo: e.target.value }))}
              />
              <TextField
                label="Precio de venta"
                type="number"
                min={0}
                value={editForm.precioVenta}
                onChange={(e) => setEditForm((f) => ({ ...f, precioVenta: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted mt-3.5 mb-0">
              El stock actual ({editing.stock}) solo se modifica desde Entradas/Salidas/Ventas.
            </p>
            <div className="flex justify-end gap-3 mt-4.5">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateProduct.isPending}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
