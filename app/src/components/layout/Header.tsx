import { useLocation, useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../../hooks/useDashboardStats';

const TITLES: Record<string, [string, string]> = {
  '/dashboard': ['Inicio', 'Resumen general del inventario'],
  '/productos': ['Productos', 'Crea y consulta el catálogo de insumos'],
  '/entradas': ['Entradas', 'Registra el ingreso de mercancía'],
  '/salidas': ['Salidas', 'Registra la salida de mercancía'],
  '/ventas': ['Ventas', 'Registra ventas y descuenta stock'],
  '/reportes': ['Reportes', 'Valorización de inventario y ventas'],
  '/usuarios': ['Usuarios', 'Gestión de accesos al sistema'],
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { stats } = useDashboardStats();
  const [pageTitle, pageSub] = TITLES[location.pathname] ?? ['', ''];

  return (
    <header className="flex items-center justify-between flex-wrap gap-3 px-4 md:px-8 py-[22px] bg-white border-b border-card-border sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="md:hidden w-9 h-9 rounded-lg border border-card-border flex items-center justify-center text-ink shrink-0"
        >
          ☰
        </button>
        <div>
          <h1 className="font-display font-semibold text-[22px] m-0">{pageTitle}</h1>
          <p className="mt-1 mb-0 text-[13px] text-muted">{pageSub}</p>
        </div>
      </div>
      {stats.lowCount > 0 && (
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 bg-danger-bg text-accent border border-danger-border px-3.5 py-2 rounded-full text-[13px] font-semibold cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          {stats.lowCount} con stock bajo
        </button>
      )}
    </header>
  );
}
