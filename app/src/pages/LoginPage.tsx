import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: loginError } = await login(usuario, clave);
    setLoading(false);
    if (loginError) setError(loginError);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(circle at 30% 20%, #1c1c1a 0%, #0d0d0c 60%)' }}
    >
      <div className="w-full max-w-[880px] flex flex-wrap bg-white rounded-[22px] overflow-hidden shadow-2xl animate-pop-in">
        <div className="flex-1 min-w-[280px] bg-sidebar text-white p-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest text-sidebar-idle">
              Inventario
            </div>
            <h1 className="font-display font-bold text-[44px] leading-[1.02] tracking-tight mt-8 mb-3.5">
              RUDOS BARBER
            </h1>
            <p className="text-sidebar-idle text-[15px] leading-relaxed m-0 max-w-[280px]">
              Control de insumos para barbería. Entradas, salidas, ventas y alertas de stock en un
              solo lugar.
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-[300px] p-11 flex flex-col justify-center">
          <h2 className="font-display font-semibold text-[22px] mt-0 mb-1.5">Iniciar sesión</h2>
          <p className="text-muted text-sm mb-6.5">Ingresa tus credenciales para continuar.</p>
          <form onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold tracking-wide text-label mb-1.5">
              Usuario
            </label>
            <input
              name="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              className="w-full px-4 py-3 border border-input-border rounded-[11px] text-[15px] bg-input-bg mb-4.5 focus:border-ink transition-colors"
            />
            <label className="block text-xs font-semibold tracking-wide text-label mb-1.5">
              Clave
            </label>
            <input
              name="clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-input-border rounded-[11px] text-[15px] bg-input-bg mb-4 focus:border-ink transition-colors"
            />
            {error && (
              <div className="bg-danger-bg text-danger-text text-[13px] px-3.5 py-2.5 rounded-[9px] mb-4">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-ink text-white border-none rounded-[11px] text-[15px] font-semibold cursor-pointer hover:bg-black transition-colors disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
