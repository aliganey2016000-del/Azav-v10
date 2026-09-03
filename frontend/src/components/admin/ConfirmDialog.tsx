import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const btnStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-teal-600 hover:bg-teal-700 text-white',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex items-start space-x-3 mb-6">
        <div className="p-2 bg-amber-50 rounded-full text-amber-600 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-600">{message}</p>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
        <button
          disabled={isLoading}
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        >
          {cancelLabel}
        </button>
        <button
          disabled={isLoading}
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${btnStyles[variant]} ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
