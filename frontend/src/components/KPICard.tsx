'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPI } from '@/lib/api';
import { formatValue, formatKPIName } from '@/lib/utils';

interface KPICardProps {
  name: string;
  kpi: KPI;
  icon?: React.ReactNode;
  accentColor?: string;
}

export default function KPICard({ name, kpi, icon, accentColor = '#6366f1' }: KPICardProps) {
  const TrendIcon =
    kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#ef4444' : '#9090a8';

  return (
    <div className="kpi-card p-5 fade-in hover:scale-[1.02] transition-transform duration-200">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
        >
          {icon || (
            <div style={{ color: accentColor }} className="w-4 h-4">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1" style={{ color: trendColor }}>
          <TrendIcon size={14} />
        </div>
      </div>

      <div className="mt-1">
        <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {formatValue(kpi.value, kpi.format)}
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {formatKPIName(name)}
        </div>
      </div>
    </div>
  );
}
