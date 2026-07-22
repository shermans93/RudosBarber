import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label: string;
  children: ReactNode;
}

function FieldWrapper({ label, children }: FieldWrapperProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-label mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3.5 py-2.5 border border-input-border rounded-[10px] text-sm bg-input-bg focus:border-ink transition-colors';

export function TextField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label}>
      <input className={inputClass} {...props} />
    </FieldWrapper>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldWrapper label={label}>
      <select className={inputClass} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
}
