import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio' },
  { to: '/productos', label: 'Productos' },
  { to: '/entradas', label: 'Entradas' },
  { to: '/salidas', label: 'Salidas' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/reportes', label: 'Reportes' },
  { to: '/usuarios', label: 'Usuarios' },
];

const BRAND_NAME = 'RUDOS BARBER';

export function Sidebar() {
  const { profile, logout } = useAuth();

  return (
    <aside className="w-[246px] shrink-0 bg-sidebar text-sidebar-idle p-4 flex flex-col border-r border-white/10 min-h-screen">
      <div className="flex items-center gap-2.5 px-2 pb-[22px]">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-white text-sidebar flex items-center justify-center font-display font-bold text-base">
          R
        </div>
        <div className="font-display font-semibold text-[15px] text-white">{BRAND_NAME}</div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-[10px] text-sm transition-colors',
                isActive ? 'bg-white text-sidebar font-semibold' : 'text-sidebar-idle hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    isActive ? 'bg-accent' : 'bg-white/20'
                  )}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-5 border-t border-white/10 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-white text-sidebar flex items-center justify-center font-semibold text-sm">
          {(profile?.nombre ?? '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white truncate">
            {profile?.nombre ?? 'Cargando...'}
          </div>
          <div className="text-[11px] text-sidebar-idle truncate">{profile?.usuario}</div>
        </div>
        <button
          onClick={logout}
          title="Salir"
          className="bg-transparent border border-white/10 text-sidebar-idle w-8 h-8 rounded-lg cursor-pointer text-[15px] hover:text-accent hover:border-accent transition-colors"
        >
          ⎋
        </button>
      </div>
    </aside>
  );
}
