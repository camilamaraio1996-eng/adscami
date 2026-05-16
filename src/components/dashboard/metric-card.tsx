'use client';

import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipInfo } from '@/components/ui/tooltip-info';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  loading?: boolean;
  color?: 'blue' | 'green' | 'violet' | 'orange' | 'rose' | 'default';
  tooltip?: string;
}

const colorMap = {
  blue: {
    card: 'border-blue-500/20 hover:border-blue-500/40 hover:glow-blue',
    accent: 'bg-blue-500/10',
    icon: 'text-blue-400',
    value: 'text-blue-100',
    bar: 'bg-blue-500/40',
  },
  green: {
    card: 'border-emerald-500/20 hover:border-emerald-500/40',
    accent: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    value: 'text-emerald-100',
    bar: 'bg-emerald-500/40',
  },
  violet: {
    card: 'border-violet-500/20 hover:border-violet-500/40',
    accent: 'bg-violet-500/10',
    icon: 'text-violet-400',
    value: 'text-violet-100',
    bar: 'bg-violet-500/40',
  },
  orange: {
    card: 'border-orange-500/20 hover:border-orange-500/40',
    accent: 'bg-orange-500/10',
    icon: 'text-orange-400',
    value: 'text-orange-100',
    bar: 'bg-orange-500/40',
  },
  rose: {
    card: 'border-rose-500/20 hover:border-rose-500/40',
    accent: 'bg-rose-500/10',
    icon: 'text-rose-400',
    value: 'text-rose-100',
    bar: 'bg-rose-500/40',
  },
  default: {
    card: 'border-white/[0.06] hover:border-white/[0.12]',
    accent: 'bg-white/[0.04]',
    icon: 'text-white/40',
    value: 'text-white',
    bar: 'bg-white/10',
  },
};

const DEFAULT_TOOLTIPS: Record<string, string> = {
  'Gasto total': 'Total invertido en el período seleccionado.',
  Impresiones: 'Veces que tu anuncio fue mostrado.',
  Alcance: 'Personas únicas que vieron tu anuncio.',
  Clics: 'Total de clics en tus anuncios.',
  CTR: 'Click-Through Rate: % de impresiones que generaron un clic. Benchmark: 0.9–1.5%.',
  CPC: 'Costo Por Clic: cuánto pagás por cada clic. Menos es mejor.',
  CPM: 'Costo Por Mil impresiones: cuánto costó llegar a 1.000 personas.',
  Frecuencia: 'Promedio de veces que una persona vio tu anuncio. >3 indica saturación.',
  ROAS: 'Return On Ad Spend: ingresos por cada $1 invertido. >3x es excelente.',
  Leads: 'Clientes potenciales generados.',
  Compras: 'Compras registradas vía píxel.',
};

export function MetricCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  trendValue,
  loading,
  color = 'default',
  tooltip,
}: MetricCardProps) {
  const styles = colorMap[color];
  const resolvedTooltip = tooltip ?? DEFAULT_TOOLTIPS[label];

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <Skeleton className="h-3 w-24 mb-3 bg-white/[0.06]" />
        <Skeleton className="h-6 w-32 mb-1 bg-white/[0.06]" />
        <Skeleton className="h-2.5 w-16 bg-white/[0.04]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-white/[0.02] p-4 transition-all duration-200 group animate-slide-up',
        styles.card
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-white/40 font-medium">{label}</p>
          {resolvedTooltip && <TooltipInfo content={resolvedTooltip} />}
        </div>
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', styles.accent)}>
            <Icon className={cn('w-3.5 h-3.5', styles.icon)} />
          </div>
        )}
      </div>

      {/* Value */}
      <p className={cn('text-xl font-semibold tracking-tight animate-count-up', styles.value)}>
        {value}
      </p>

      {/* Sub row */}
      {(subValue || trendValue) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {trendValue && (
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-emerald-400',
                trend === 'down' && 'text-rose-400',
                trend === 'neutral' && 'text-white/40'
              )}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
          {subValue && <span className="text-xs text-white/30">{subValue}</span>}
        </div>
      )}
    </div>
  );
}
