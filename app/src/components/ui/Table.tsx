import type { ReactNode } from 'react';
import clsx from 'clsx';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={clsx(
        'font-display text-[11px] uppercase tracking-wide text-muted font-semibold px-5 py-2.5',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className,
}: {
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td
      className={clsx(
        'px-5 py-3 border-t border-row-border text-sm',
        align === 'right' ? 'text-right' : 'text-left',
        className
      )}
    >
      {children}
    </td>
  );
}
