import { useEffect, useState } from 'react';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { Button } from '../ui/Button';

const SESSION_FLAG = 'rudosbarber_low_alert_shown';

export function LowStockModal() {
  const { low, isLoading } = useDashboardStats();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (low.length > 0 && !sessionStorage.getItem(SESSION_FLAG)) {
      setOpen(true);
    }
  }, [isLoading, low.length]);

  if (!open) return null;

  function close() {
    sessionStorage.setItem(SESSION_FLAG, '1');
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
      <div className="bg-white rounded-[20px] w-full max-w-[480px] overflow-hidden shadow-2xl animate-pop-in">
        <div className="px-7 pt-6.5 pb-5 border-b border-row-border">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-xl bg-danger-bg text-accent flex items-center justify-center text-xl">
              !
            </div>
            <div>
              <h3 className="font-display font-semibold text-[19px] m-0">
                Productos con stock bajo
              </h3>
              <p className="mt-1 mb-0 text-[13px] text-muted">
                {low.length} producto(s) requieren reabastecimiento
              </p>
            </div>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {low.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-7 py-3.5 border-b border-[#f6f6f4]"
            >
              <div>
                <div className="text-sm font-semibold">{p.descripcion}</div>
                <div className="text-xs text-muted mt-0.5">
                  {p.marca} · {p.presentacion}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold text-accent">{p.stock}</div>
                <div className="text-[11px] text-muted">mín {p.stock_minimo}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-7 py-4.5 flex gap-3 justify-end">
          <Button onClick={close}>Entendido</Button>
        </div>
      </div>
    </div>
  );
}
