import clsx from 'clsx';

interface KpiCardProps {
  label: string;
  value: string | number;
  tone?: 'default' | 'danger';
}

export function KpiCard({ label, value, tone = 'default' }: KpiCardProps) {
  const danger = tone === 'danger';
  return (
    <div
      className={clsx(
        'border rounded-card px-[22px] py-5',
        danger ? 'bg-danger-bg border-danger-border' : 'bg-white border-card-border'
      )}
    >
      <div
        className={clsx(
          'text-xs uppercase tracking-wide',
          danger ? 'text-danger-text' : 'text-muted'
        )}
      >
        {label}
      </div>
      <div
        className={clsx(
          'font-display text-[32px] font-semibold mt-2',
          danger ? 'text-danger-text' : 'text-ink'
        )}
      >
        {value}
      </div>
    </div>
  );
}
