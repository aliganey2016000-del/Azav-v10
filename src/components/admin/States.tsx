import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-500">
    <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({
  title = 'No records found',
  description = 'There are no items matching your request or filter criteria.',
  actionLabel,
  onAction,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200/80 shadow-sm">
    <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
      {icon || <Inbox className="w-8 h-8" />}
    </div>
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500 max-w-md mt-1 mb-4">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-sm"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({ title = 'Failed to load data', message = 'An error occurred while fetching information.', onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-rose-50/50 border border-rose-200 rounded-xl text-center">
    <AlertCircle className="w-8 h-8 text-rose-600 mb-2" />
    <h3 className="text-base font-semibold text-rose-900">{title}</h3>
    <p className="text-sm text-rose-700 mt-1 max-w-md">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 text-sm font-medium text-rose-700 bg-white border border-rose-300 rounded-lg hover:bg-rose-50 transition shadow-sm flex items-center space-x-2"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    )}
  </div>
);
