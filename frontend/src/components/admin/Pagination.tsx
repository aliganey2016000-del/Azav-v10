import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '../../types/admin.types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange }) => {
  if (!meta) return null;

  const page = meta.page || 1;
  const limit = meta.limit || 20;
  const total = meta.total || 0;
  const totalPages = meta.totalPages || 1;

  if (totalPages <= 1) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:flex-row dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
      <div className="font-medium">
        Showing <span className="font-extrabold text-slate-900 dark:text-white">{startRecord}</span> to{' '}
        <span className="font-extrabold text-slate-900 dark:text-white">{endRecord}</span> of{' '}
        <span className="font-extrabold text-slate-900 dark:text-white">{total}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-200 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:text-teal-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-3 font-extrabold text-white shadow-sm">
          {page}
        </div>

        <span className="hidden font-semibold text-slate-400 sm:inline">of {totalPages}</span>

        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-200 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:text-teal-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
