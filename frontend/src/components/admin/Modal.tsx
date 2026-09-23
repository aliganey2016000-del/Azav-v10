import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="fixed inset-0 h-full w-full bg-slate-950/60 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          className={`relative z-10 w-full ${maxWidthClasses[maxWidth]} overflow-hidden rounded-t-[26px] border border-slate-200 bg-white shadow-2xl sm:rounded-[26px] dark:border-slate-700 dark:bg-[#0f1b2d]`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/40">
            <div>
              <div className="mb-1 h-1 w-8 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 sm:hidden" />
              <h3 className="text-base font-extrabold tracking-tight text-slate-950 sm:text-lg dark:text-white">{title}</h3>
            </div>
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="max-h-[82vh] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
