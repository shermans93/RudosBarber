import { useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, Td, Th } from '../components/ui/Table';
import { SelectField, TextField } from '../components/ui/FormField';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useCreateUser, useProfiles, useResetUserPassword } from '../hooks/useProfiles';
import type { Profile } from '../types/database.types';

const EMPTY_FORM = { nombre: '', usuario: '', rol: 'Administrador', clave: '' };

function ChangePasswordModal({ user, onClose }: { user: Profile; onClose: () => void }) {
  const resetPassword = useResetUserPassword();
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (nuevaClave.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaClave !== confirmarClave) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }
    resetPassword.mutate(
      { userId: user.id, nuevaClave },
      { onSuccess: () => setSuccess(true) }
    );
  }

  return (
    <Modal title={`Cambiar contraseña — ${user.usuario}`} onClose={onClose}>
      {success ? (
        <div>
          <div className="bg-success-bg text-success-text text-[13px] px-3.5 py-2.5 rounded-[9px] mb-4.5">
            Contraseña actualizada correctamente.
          </div>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
            <TextField
              label="Nueva contraseña"
              type="password"
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
              placeholder="••••••"
            />
            <TextField
              label="Confirmar contraseña"
              type="password"
              value={confirmarClave}
              onChange={(e) => setConfirmarClave(e.target.value)}
              placeholder="••••••"
            />
          </div>
          {(formError || resetPassword.isError) && (
            <div className="mt-3.5 bg-danger-bg text-danger-text text-[13px] px-3.5 py-2.5 rounded-[9px]">
              {formError || resetPassword.error?.message}
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4.5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={resetPassword.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function UsuariosPage() {
  const { data: profiles = [] } = useProfiles();
  const createUser = useCreateUser();
  const [form, setForm] = useState(EMPTY_FORM);
  const [passwordTarget, setPasswordTarget] = useState<Profile | null>(null);

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
              <Th align="right">Acciones</Th>
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
                <Td align="right">
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => setPasswordTarget(u)}
                  >
                    Cambiar contraseña
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {passwordTarget && (
        <ChangePasswordModal user={passwordTarget} onClose={() => setPasswordTarget(null)} />
      )}
    </>
  );
}
