import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { OrganizationAdminAccountEditor } from './OrganizationAdminAccountEditor';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  const location = useLocation();
  const organizationDetailMatch = location.pathname.match(/^\/admin\/organizations\/([^/]+)$/);
  const organizationId = organizationDetailMatch?.[1];

  return (
    <section className="relative mb-6 overflow-hidden rounded-[26px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50 px-5 py-5 shadow-sm sm:px-6 sm:py-6 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950 dark:shadow-xl">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-20 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-teal-700 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-300">
            <Sparkles className="h-3.5 w-3.5" />
            AZAAM MEDICS
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px] dark:text-slate-300">
              {description}
            </p>
          )}
        </div>

        {(action || organizationId) && (
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            {organizationId && <OrganizationAdminAccountEditor organizationId={organizationId} />}
            {action}
          </div>
        )}
      </div>
    </section>
  );
};
