'use client';

import type { FunnelStep } from '@/types/meta';
import { formatNumber } from '@/lib/analytics';

interface FunnelChartProps {
  steps: FunnelStep[];
}

export function FunnelChart({ steps }: FunnelChartProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-white/20 text-sm">
        Sin datos de embudo disponibles
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={step.label} className="relative animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm">{step.icon}</span>
            <span className="text-[12px] text-white/60 flex-1">{step.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-white/80">{formatNumber(step.value)}</span>
              <span className="text-[10px] text-white/30">({step.percentage.toFixed(1)}%)</span>
              {i > 0 && step.dropoff > 0 && (
                <span className="text-[10px] text-rose-400 font-medium">
                  -{step.dropoff.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${step.percentage}%`,
                backgroundColor: step.color,
                boxShadow: `0 0 8px ${step.color}40`,
              }}
            />
          </div>
          {i < steps.length - 1 && step.dropoff > 30 && (
            <div className="absolute right-0 -bottom-0.5 flex items-center gap-1">
              <div
                className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-medium"
              >
                Caída crítica
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
