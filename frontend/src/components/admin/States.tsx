import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d] dark:text-slate-400">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">
      <RefreshCw className="h-5 w-5 animate-spin" />
    </div>
    <p className="text-sm font-bold">{message}</p>
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
  <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
      {icon || <Inbox className="h-6 w-6" />}
    </div>
    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">{title}</h3>
    <p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 min-h-11 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 text-sm font-extrabold text-white shadow-sm shadow-teal-600/20 transition hover:from-teal-700 hover:to-emerald-600"
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
  <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
      <AlertCircle className="h-5 w-5" />
    </div>
    <h3 className="text-base font-extrabold text-rose-900 dark:text-rose-200">{title}</h3>
    <p className="mt-1 max-w-md text-sm leading-6 text-rose-700 dark:text-rose-300">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
      >
        <RefreshCw className="h-4 w-4" />
        <span>Try Again</span>
      </button>
    )}
  </div>
);
