import React from 'react';
import { useLocation } from 'react-router-dom';
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
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {(action || organizationId) && (
        <div className="flex flex-wrap items-center gap-2">
          {organizationId && <OrganizationAdminAccountEditor organizationId={organizationId} />}
          {action}
        </div>
      )}
    </div>
  );
};
