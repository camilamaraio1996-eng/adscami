'use client';

import { AlertTriangle, AlertCircle, Info, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Diagnostic, DiagnosticSeverity } from '@/types/meta';
import { cn } from '@/lib/utils';

const SEVERITY_CONFIG: Record<DiagnosticSeverity, { icon: typeof AlertTriangle; color: string; bg: string; border: string; label: string }> = {
  alta: {
    icon: AlertTriangle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/5',
    border: 'border-rose-500/20',
    label: 'Alta',
  },
  media: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20',
    label: 'Media',
  },
  baja: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    label: 'Baja',
  },
};

function DiagnosticCard({ diagnostic }: { diagnostic: Diagnostic }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[diagnostic.severity];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border p-4 transition-all', config.bg, config.border)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon className={cn('w-4 h-4', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-white">{diagnostic.problem}</p>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', config.color, config.border, config.bg)}>
                {config.label}
              </span>
              <button onClick={() => setExpanded(!expanded)} className="text-white/30 hover:text-white/60">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-white/50 mt-1">{diagnostic.explanation}</p>
          {expanded && (
            <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
              <div className="flex gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-white/30 mb-0.5">Recomendación</p>
                  <p className="text-xs text-white/70">{diagnostic.recommendation}</p>
                </div>
              </div>
              <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                <p className="text-[10px] text-white/30 mb-0.5">Acción concreta</p>
                <p className="text-xs text-white/80">{diagnostic.action}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DiagnosticPanelProps {
  diagnostics: Diagnostic[];
  recommendations: string[];
}

export function DiagnosticPanel({ diagnostics, recommendations }: DiagnosticPanelProps) {
  const high = diagnostics.filter((d) => d.severity === 'alta');
  const medium = diagnostics.filter((d) => d.severity === 'media');
  const low = diagnostics.filter((d) => d.severity === 'baja');

  if (diagnostics.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-400">Sin problemas detectados</p>
          <p className="text-xs text-emerald-400/60 mt-0.5">La campaña tiene un rendimiento saludable en todas las métricas analizadas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-white">Diagnóstico automático</p>
        <div className="flex items-center gap-1.5">
          {high.length > 0 && <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">{high.length} alta</span>}
          {medium.length > 0 && <span className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded">{medium.length} media</span>}
          {low.length > 0 && <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">{low.length} baja</span>}
        </div>
      </div>

      {/* Diagnostics */}
      <div className="space-y-2">
        {[...high, ...medium, ...low].map((d) => (
          <DiagnosticCard key={d.id} diagnostic={d} />
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs font-medium text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
            Qué haría ahora
          </p>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-white/20 mt-0.5 shrink-0 font-mono">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-xs text-white/60">{rec}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
