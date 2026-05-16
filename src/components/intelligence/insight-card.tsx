'use client';

import type { AIInsight } from '@/types/meta';
import { cn } from '@/lib/utils';

const typeStyles: Record<AIInsight['type'], { border: string; bg: string; badge: string; badgeText: string }> = {
  positive: {
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
  },
  negative: {
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/5',
    badge: 'bg-rose-500/20',
    badgeText: 'text-rose-400',
  },
  opportunity: {
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/5',
    badge: 'bg-violet-500/20',
    badgeText: 'text-violet-400',
  },
  warning: {
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
  },
  prediction: {
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    badge: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
  },
};

const typeLabels: Record<AIInsight['type'], string> = {
  positive: 'Positivo',
  negative: 'Problema',
  opportunity: 'Oportunidad',
  warning: 'Atención',
  prediction: 'Predicción',
};

const impactColors: Record<AIInsight['impact'], string> = {
  high: 'text-rose-400',
  medium: 'text-amber-400',
  low: 'text-white/30',
};

const impactLabels: Record<AIInsight['impact'], string> = {
  high: 'Alto impacto',
  medium: 'Impacto medio',
  low: 'Bajo impacto',
};

interface InsightCardProps {
  insight: AIInsight;
  index?: number;
}

export function InsightCard({ insight, index = 0 }: InsightCardProps) {
  const styles = typeStyles[insight.type];

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200 hover:border-white/[0.12] animate-slide-up',
        styles.border,
        styles.bg
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">{insight.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                styles.badge,
                styles.badgeText
              )}
            >
              {typeLabels[insight.type]}
            </span>
            <span className={cn('text-[10px] font-medium', impactColors[insight.impact])}>
              {impactLabels[insight.impact]}
            </span>
          </div>
          <p className="text-[13px] font-semibold text-white mb-1">{insight.title}</p>
          <p className="text-[12px] text-white/50 leading-relaxed">{insight.detail}</p>
          {insight.action && (
            <p className="mt-2 text-[11px] text-violet-400 font-medium">
              → {insight.action}
            </p>
          )}
          {insight.value && (
            <div className="mt-2">
              <span className="text-[11px] text-white/30">
                {insight.metric}: <span className="text-white/60 font-mono">{insight.value}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
