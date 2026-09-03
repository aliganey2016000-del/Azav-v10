import React from 'react';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface CategoryData {
  category: string;
  count: number;
  color: string;
}

export const LineChart: React.FC<{
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}> = ({ data, height = 200, color = '#0d9488', formatValue }) => {
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = Math.min(...data.map((d) => d.value), 0);
  const range = maxVal - minVal || 1;
  const stepX = chartW / (data.length - 1 || 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
    value: d.value,
    label: d.label,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => {
    const val = minVal + (range * i) / gridLines;
    const y = padding.top + chartH - (i / gridLines) * chartH;
    return { val, y };
  });

  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridValues.map((g, i) => (
        <g key={i}>
          <line x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
          <text x={padding.left - 8} y={g.y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
            {formatValue ? formatValue(g.val) : Math.round(g.val)}
          </text>
        </g>
      ))}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i} className="group">
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
          <text x={p.x} y={padding.top + chartH + 18} textAnchor="middle" className="fill-slate-500 text-[10px]">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

export const BarChart: React.FC<{
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}> = ({ data, height = 200, color = '#0d9488', formatValue }) => {
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = (chartW / data.length) * 0.6;
  const barGap = chartW / data.length;

  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => {
    const val = (maxVal * i) / gridLines;
    const y = padding.top + chartH - (i / gridLines) * chartH;
    return { val, y };
  });

  const gradId = `bar-grad-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {gridValues.map((g, i) => (
        <g key={i}>
          <line x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
          <text x={padding.left - 8} y={g.y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
            {formatValue ? formatValue(g.val) : Math.round(g.val)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = padding.left + i * barGap + (barGap - barWidth) / 2;
        const y = padding.top + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx="4" fill={`url(#${gradId})`} />
            <text x={x + barWidth / 2} y={padding.top + chartH + 18} textAnchor="middle" className="fill-slate-500 text-[10px]">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const DonutChart: React.FC<{
  data: CategoryData[];
  size?: number;
}> = ({ data, size = 180 }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  const radius = size / 2 - 20;
  const innerRadius = radius * 0.62;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((d) => {
    const fraction = d.count / total;
    const dash = fraction * circumference;
    const seg = {
      color: d.color,
      dash,
      gap: circumference - dash,
      offset: -offset,
      label: d.category,
      count: d.count,
      percent: Math.round(fraction * 100),
    };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={radius - innerRadius}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            transform={`rotate(-90 ${center} ${center})`}
            strokeLinecap="butt"
          />
        ))}
        <text x={center} y={center - 4} textAnchor="middle" className="fill-slate-900 text-2xl font-bold">
          {total}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" className="fill-slate-400 text-xs">
          Total
        </text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
              <span className="text-slate-600">{s.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{s.count}</span>
              <span className="text-slate-400 text-xs">{s.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Sparkline: React.FC<{
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}> = ({ data, color = '#0d9488', width = 100, height = 30 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * height,
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const ProgressBar: React.FC<{
  value: number;
  max: number;
  color?: string;
  className?: string;
}> = ({ value, max, color = '#0d9488', className = '' }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={`h-2 w-full rounded-full bg-slate-100 overflow-hidden ${className}`}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};
