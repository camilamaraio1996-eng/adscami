'use client';

import type { Alert } from '@/types/meta';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Target,
  Users,
  Paintbrush,
  Code,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

const priorityStyles: Record<Alert['priority'], { dot: string; bg: string; border: string; badge: string; badgeText: string }> = {
  critical: {
    dot: 'bg-rose-500',
    bg: 'bg-rose-500/5',
    border: 'border-rose-500/20',
    badge: 'bg-rose-500/20',
    badgeText: 'text-rose-400',
  },
  high: {
    dot: 'bg-orange-500',
    bg: 'bg-orange-500/5',
    border: 'border-orange-500/20',
    badge: 'bg-orange-500/20',
    badgeText: 'text-orange-400',
  },
  medium: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
  },
  low: {
    dot: 'bg-white/20',
    bg: 'bg-white/[0.02]',
    border: 'border-white/[0.06]',
    badge: 'bg-white/10',
    badgeText: 'text-white/40',
  },
};

const priorityLabels: Record<Alert['priority'], string> = {
  critical: 'CRÍTICO',
  high: 'ALTO',
  medium: 'MEDIO',
  low: 'BAJO',
};

const categoryIcons: Record<Alert['category'], React.ComponentType<{ className?: string }>> = {
  performance: TrendingDown,
  creative: Paintbrush,
  audience: Users,
  pixel: Code,
  budget: DollarSign,
  funnel: Target,
};

interface AlertItemProps {
  alert: Alert;
  index?: number;
}

export function AlertItem({ alert, index = 0 }: AlertItemProps) {
  const styles = priorityStyles[alert.priority];
  const CategoryIcon = categoryIcons[alert.category] || AlertTriangle;

  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 transition-all duration-200 animate-slide-up',
        styles.bg,
        styles.border
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <div className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
          <CategoryIcon className="w-3.5 h-3.5 text-white/30" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider',
                styles.badge,
                styles.badgeText
              )}
            >
              {priorityLabels[alert.priority]}
            </span>
            {alert.campaignName && (
              <span className="text-[10px] text-white/30 truncate max-w-[160px]">
                {alert.campaignName}
              </span>
            )}
          </div>
          <p className="text-[13px] font-semibold text-white mb-0.5">{alert.title}</p>
          <p className="text-[12px] text-white/50 leading-relaxed">{alert.message}</p>
          {alert.metric && alert.value && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] text-white/30">
                {alert.metric}:{' '}
                <span className="font-mono text-white/60">{alert.value}</span>
                {alert.threshold && (
                  <span className="text-white/20"> (umbral: {alert.threshold})</span>
                )}
              </span>
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-violet-400 font-medium">→ {alert.action}</p>
        </div>
      </div>
    </div>
  );
}
