import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
      <div className="bg-white rounded-[20px] w-full max-w-[520px] overflow-hidden shadow-2xl animate-pop-in">
        <div className="px-7 pt-6 pb-5 border-b border-row-border flex items-center justify-between">
          <h3 className="font-display font-semibold text-[19px] m-0">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-lg border border-card-border text-muted hover:text-ink hover:border-ink transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}
