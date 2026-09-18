import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'teal';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    purple: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30',
    teal: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30',
  };

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const upper = (status || '').toUpperCase();
  if (['ACTIVE', 'APPROVED', 'VERIFIED', 'ISSUED', 'CONFIRMED'].includes(upper)) {
    return <Badge variant="success">{upper}</Badge>;
  }
  if (['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'DRAFT'].includes(upper)) {
    return <Badge variant="warning">{upper}</Badge>;
  }
  if (['INACTIVE', 'REJECTED', 'CANCELLED', 'REVOKED', 'DISABLED', 'ARCHIVED', 'SUSPENDED'].includes(upper)) {
    return <Badge variant="danger">{upper}</Badge>;
  }
  return <Badge variant="neutral">{upper}</Badge>;
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const roleMap: Record<string, { label: string; variant: 'purple' | 'teal' | 'info' | 'warning' | 'neutral' }> = {
    SUPER_ADMIN: { label: 'Super Admin', variant: 'purple' },
    AZAAM_STAFF: { label: 'AZAAM Staff', variant: 'teal' },
    UNIVERSITY_ADMIN: { label: 'University Admin', variant: 'info' },
    UNIVERSITY_STAFF: { label: 'University Staff', variant: 'info' },
    ORGANIZATION_ADMIN: { label: 'Org Admin', variant: 'warning' },
    ORGANIZATION_STAFF: { label: 'Org Staff', variant: 'warning' },
    CLINICAL_SUPERVISOR: { label: 'Supervisor', variant: 'teal' },
    STUDENT: { label: 'Student', variant: 'neutral' },
    INDEPENDENT_APPLICANT: { label: 'Independent', variant: 'neutral' },
  };

  const item = roleMap[role] || { label: role, variant: 'neutral' as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
};
