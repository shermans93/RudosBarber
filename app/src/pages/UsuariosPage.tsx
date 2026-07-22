import { useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, Td, Th } from '../components/ui/Table';
import { SelectField, TextField } from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import { useCreateUser, useProfiles } from '../hooks/useProfiles';

const EMPTY_FORM = { nombre: '', usuario: '', rol: 'Administrador', clave: '' };

export function UsuariosPage() {
  const { data: profiles = [] } = useProfiles();
  const createUser = useCreateUser();
  const [form, setForm] = useState(EMPTY_FORM);

  function handleChange(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.usuario.trim() || !form.clave) return;
    createUser.mutate(
      {
        nombre: form.nombre.trim(),
        usuario: form.usuario.trim(),
        rol: form.rol,
        clave: form.clave,
      },
      { onSuccess: () => setForm(EMPTY_FORM) }
    );
  }

  return (
    <>
      <Card className="p-6 mb-6">
        <h3 className="font-display font-semibold text-base mt-0 mb-4.5">Nuevo usuario</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Nombre completo"
            />
            <TextField
              label="Usuario"
              value={form.usuario}
              onChange={(e) => handleChange('usuario', e.target.value)}
              placeholder="usuario"
            />
            <SelectField label="Rol" value={form.rol} onChange={(e) => handleChange('rol', e.target.value)}>
              <option value="Administrador">Administrador</option>
            </SelectField>
            <TextField
              label="Clave"
              type="password"
              value={form.clave}
              onChange={(e) => handleChange('clave', e.target.value)}
              placeholder="••••••"
            />
          </div>
          {createUser.isError && (
            <div className="mt-3.5 bg-danger-bg text-danger-text text-[13px] px-3.5 py-2.5 rounded-[9px]">
              {createUser.error.message}
            </div>
          )}
          <Button type="submit" className="mt-4.5" disabled={createUser.isPending}>
            + Crear usuario
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Usuario</Th>
              <Th>Rol</Th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((u) => (
              <tr key={u.id}>
                <Td className="font-medium">{u.nombre}</Td>
                <Td className="text-label">{u.usuario}</Td>
                <Td>
                  <Badge>{u.rol}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
