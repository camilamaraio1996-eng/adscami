'use client';

import { useState, useMemo } from 'react';
import { GitCompare, Plus, X, Trophy } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { useCampaigns } from '@/hooks/use-meta-data';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getObjectiveLabel,
  getActionValue,
  getRoas,
} from '@/lib/analytics';
import type { CampaignWithInsights } from '@/types/meta';
import { cn } from '@/lib/utils';

type MetricKey = 'spend' | 'ctr' | 'cpc' | 'cpm' | 'results' | 'roas' | 'frequency';

function getMetricValue(c: CampaignWithInsights, key: MetricKey): number {
  const ins = c.insights;
  if (!ins) return 0;
  switch (key) {
    case 'spend': return parseFloat(ins.spend || '0');
    case 'ctr': return parseFloat(ins.ctr || '0');
    case 'cpc': return parseFloat(ins.cpc || '0');
    case 'cpm': return parseFloat(ins.cpm || '0');
    case 'results': return getActionValue(ins.actions, 'lead') + getActionValue(ins.actions, 'purchase') + getActionValue(ins.actions, 'messaging_conversation_started_7d');
    case 'roas': return getRoas(ins.purchase_roas) || 0;
    case 'frequency': return parseFloat(ins.frequency || '0');
  }
}

function isBetter(key: MetricKey, a: number, b: number): boolean {
  const lowerIsBetter: MetricKey[] = ['cpc', 'cpm', 'frequency'];
  if (lowerIsBetter.includes(key)) return a < b && b > 0;
  return a > b;
}

const METRICS: { key: MetricKey; label: string; format: (v: number) => string }[] = [
  { key: 'spend', label: 'Gasto', format: (v) => formatCurrency(v) },
  { key: 'ctr', label: 'CTR', format: (v) => formatPercent(v) },
  { key: 'cpc', label: 'CPC', format: (v) => formatCurrency(v) },
  { key: 'cpm', label: 'CPM', format: (v) => formatCurrency(v) },
  { key: 'results', label: 'Resultados', format: (v) => formatNumber(v) },
  { key: 'roas', label: 'ROAS', format: (v) => (v > 0 ? `${v.toFixed(2)}x` : '—') },
  { key: 'frequency', label: 'Frecuencia', format: (v) => v.toFixed(2) },
];

export default function ComparePage() {
  const [preset, setPreset] = useState('last_30d');
  const { campaigns, loading } = useCampaigns(preset);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selected = useMemo(
    () => campaigns.filter((c) => selectedIds.includes(c.id)),
    [campaigns, selectedIds]
  );

  const toggleCampaign = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const getWinner = (key: MetricKey): string | null => {
    if (selected.length < 2) return null;
    const values = selected.map((c) => ({ id: c.id, v: getMetricValue(c, key) }));
    const best = values.reduce((a, b) => (isBetter(key, a.v, b.v) ? a : b));
    const allDiff = values.some((x) => x.v !== best.v);
    return allDiff ? best.id : null;
  };

  const COLORS = ['text-blue-400', 'text-violet-400', 'text-emerald-400', 'text-orange-400'];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Comparador"
        subtitle="Compará hasta 4 campañas"
        showDatePicker
        datePreset={preset}
        onDateChange={(p) => setPreset(p)}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Campaign selector */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs font-medium text-white mb-3">Seleccioná campañas para comparar</p>
          {loading ? (
            <p className="text-xs text-white/30">Cargando campañas...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {campaigns.map((c, i) => {
                const idx = selectedIds.indexOf(c.id);
                const selected = idx !== -1;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCampaign(c.id)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5',
                      selected
                        ? `${COLORS[idx]} border-current bg-current/10`
                        : 'text-white/40 border-white/[0.06] hover:border-white/20 hover:text-white/70'
                    )}
                  >
                    {selected && <span className="font-bold">{idx + 1}.</span>}
                    <span className="truncate max-w-[180px]">{c.name}</span>
                    {selected && <X className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Comparison table */}
        {selected.length >= 2 ? (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="grid" style={{ gridTemplateColumns: `180px repeat(${selected.length}, 1fr)` }}>
              {/* Header */}
              <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]" />
              {selected.map((c, i) => (
                <div key={c.id} className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] border-l border-l-white/[0.04]">
                  <p className={cn('text-xs font-semibold truncate', COLORS[i])}>{c.name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{getObjectiveLabel(c.objective)}</p>
                </div>
              ))}

              {/* Metrics */}
              {METRICS.map(({ key, label, format }) => {
                const winner = getWinner(key);
                return [
                  <div key={`label-${key}`} className="px-4 py-3 border-b border-white/[0.03] flex items-center">
                    <span className="text-xs text-white/40">{label}</span>
                  </div>,
                  ...selected.map((c, i) => {
                    const val = getMetricValue(c, key);
                    const isWinner = winner === c.id;
                    return (
                      <div key={`${c.id}-${key}`} className="px-4 py-3 border-b border-white/[0.03] border-l border-l-white/[0.04] flex items-center gap-1.5">
                        <span className={cn('text-xs font-medium', isWinner ? COLORS[i] : 'text-white/60')}>
                          {format(val)}
                        </span>
                        {isWinner && <Trophy className="w-3 h-3 text-yellow-400" />}
                      </div>
                    );
                  }),
                ];
              })}
            </div>

            {/* Winner summary */}
            <div className="px-4 py-3 bg-white/[0.01] flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <p className="text-xs text-white/50">
                {(() => {
                  const wins: Record<string, number> = {};
                  METRICS.forEach(({ key }) => {
                    const w = getWinner(key);
                    if (w) wins[w] = (wins[w] || 0) + 1;
                  });
                  const topId = Object.entries(wins).sort((a, b) => b[1] - a[1])[0];
                  if (!topId) return 'No hay ganadora clara';
                  const topCampaign = selected.find((c) => c.id === topId[0]);
                  return `Campaña ganadora: ${topCampaign?.name} (${topId[1]}/${METRICS.length} métricas)`;
                })()}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-sm text-white/40">Seleccioná al menos 2 campañas</p>
            <p className="text-xs text-white/20">Podés comparar hasta 4 campañas simultáneamente</p>
          </div>
        )}
      </div>
    </div>
  );
}
