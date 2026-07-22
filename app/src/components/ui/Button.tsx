import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-[10px] px-5 py-2.5 text-sm font-semibold cursor-pointer transition-colors',
        variant === 'primary' && 'bg-ink text-white hover:bg-black',
        variant === 'ghost' &&
          'bg-transparent border border-card-border text-label hover:border-accent hover:text-accent',
        className
      )}
      {...props}
    />
  );
}
