import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
}

const colorMap = {
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
  green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
  orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
  rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
  default: 'from-white/[0.04] to-transparent border-white/[0.06]',
};

const iconColorMap = {
  blue: 'text-blue-400',
  green: 'text-emerald-400',
  violet: 'text-violet-400',
  orange: 'text-orange-400',
  rose: 'text-rose-400',
  default: 'text-white/40',
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
}: MetricCardProps) {
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
        'rounded-xl border bg-gradient-to-br p-4 transition-all duration-200 hover:border-white/[0.10] group',
        colorMap[color]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-white/40 font-medium">{label}</p>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
            <Icon className={cn('w-3.5 h-3.5', iconColorMap[color])} />
          </div>
        )}
      </div>
      <p className="text-xl font-semibold text-white tracking-tight">{value}</p>
      {(subValue || trendValue) && (
        <div className="mt-1 flex items-center gap-1.5">
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
