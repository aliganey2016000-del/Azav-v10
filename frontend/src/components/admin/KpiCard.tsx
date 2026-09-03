import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  color?: 'teal' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  color = 'teal',
  onClick,
}) => {
  const colorMap = {
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'focus:ring-teal-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'focus:ring-indigo-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'focus:ring-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'focus:ring-amber-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'focus:ring-rose-500' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'focus:ring-sky-500' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'focus:ring-violet-500' },
  };

  const current = colorMap[color] || colorMap.teal;

  return (
    <div
      onClick={onClick}
      className={`p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex items-start justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${current.bg} ${current.text}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
