import type { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-white border border-card-border rounded-card overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'px-5 py-4 border-b border-card-border flex items-center justify-between gap-2.5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-display font-semibold text-base m-0">{children}</h3>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-7 px-5 text-center text-muted text-sm">{children}</div>;
}
