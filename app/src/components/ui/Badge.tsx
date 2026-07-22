import type { ReactNode } from 'react';
import clsx from 'clsx';

type BadgeTone = 'success' | 'danger' | 'neutral' | 'accent';

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-success-bg text-success-text',
  danger: 'bg-danger-bg text-danger-text',
  neutral: 'bg-row-border text-label',
  accent: 'bg-danger-bg text-accent',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-block text-xs font-bold px-2.5 py-0.5 rounded-full',
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
