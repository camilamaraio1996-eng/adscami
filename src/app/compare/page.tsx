'use client';

import { useState, useMemo } from 'react';
import { GitCompare, Plus, X, Trophy } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { useCampaigns, useComparatorItems } from '@/hooks/use-meta-data';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getObjectiveLabel,
  getActionValue,
  getRoas,
} from '@/lib/analytics';
import type { CampaignWithInsights, InsightsData } from '@/types/meta';
import { cn } from '@/lib/utils';

type MetricKey = 'spend' | 'ctr' | 'cpc' | 'cpm' | 'results' | 'roas' | 'frequency';
type TabKey = 'campaigns' | 'adsets' | 'ads';

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

function getMetricValueFromInsights(ins: InsightsData, key: MetricKey): number {
  switch (key) {
    case 'spend': return parseFloat(ins.spend || '0');
    case 'ctr': return parseFloat(ins.ctr || '0');
    case 'cpc': return parseFloat(ins.cpc || '0');
    case 'cpm': return parseFloat(ins.cpm || '0');
    case 'results': return getActionValue(ins.actions, 'lead') + getActionValue(ins.actions, 'purchase');
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

const COLORS = ['text-blue-400', 'text-violet-400', 'text-emerald-400', 'text-orange-400'];

function ComparisonTable({
  selectedIds,
  names,
  subtitles,
  getVal,
  onRemove,
}: {
  selectedIds: string[];
  names: string[];
  subtitles: string[];
  getVal: (id: string, key: MetricKey) => number;
  onRemove: (id: string) => void;
}) {
  const getWinner = (key: MetricKey): string | null => {
    if (selectedIds.length < 2) return null;
    const values = selectedIds.map((id) => ({ id, v: getVal(id, key) }));
    const best = values.reduce((a, b) => (isBetter(key, a.v, b.v) ? a : b));
    const allDiff = values.some((x) => x.v !== best.v);
    return allDiff ? best.id : null;
  };

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: `180px repeat(${selectedIds.length}, 1fr)` }}>
        <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]" />
        {selectedIds.map((id, i) => (
          <div key={id} className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] border-l border-l-white/[0.04]">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className={cn('text-xs font-semibold truncate', COLORS[i])}>{names[i]}</p>
                {subtitles[i] && (
                  <p className="text-[10px] text-white/30 mt-0.5 truncate">{subtitles[i]}</p>
                )}
              </div>
              <button onClick={() => onRemove(id)} className="text-white/20 hover:text-white/50 shrink-0 mt-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {METRICS.map(({ key, label, format }) => {
          const winner = getWinner(key);
          return [
            <div key={`label-${key}`} className="px-4 py-3 border-b border-white/[0.03] flex items-center">
              <span className="text-xs text-white/40">{label}</span>
            </div>,
            ...selectedIds.map((id, i) => {
              const val = getVal(id, key);
              const isWinner = winner === id;
              return (
                <div key={`${id}-${key}`} className="px-4 py-3 border-b border-white/[0.03] border-l border-l-white/[0.04] flex items-center gap-1.5">
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
            const idx = selectedIds.indexOf(topId[0]);
            return `Ganador: ${names[idx] ?? topId[0]} (${topId[1]}/${METRICS.length} métricas)`;
          })()}
        </p>
      </div>
    </div>
  );
}

function CampaignsTab({ preset }: { preset: string }) {
  const { campaigns, loading } = useCampaigns(preset);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selected = useMemo(
    () => campaigns.filter((c) => selectedIds.includes(c.id)),
    [campaigns, selectedIds]
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-xs font-medium text-white mb-3">Seleccioná campañas para comparar</p>
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-7 w-32 rounded-lg" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <p className="text-xs text-white/30">No hay datos disponibles</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {campaigns.map((c, i) => {
              const idx = selectedIds.indexOf(c.id);
              const isSel = idx !== -1;
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5',
                    isSel
                      ? `${COLORS[idx]} border-current bg-current/10`
                      : 'text-white/40 border-white/[0.06] hover:border-white/20 hover:text-white/70'
                  )}
                >
                  {isSel && <span className="font-bold">{idx + 1}.</span>}
                  <span className="truncate max-w-[180px]">{c.name}</span>
                  {isSel && <X className="w-3 h-3 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected.length >= 2 ? (
        <ComparisonTable
          selectedIds={selected.map((c) => c.id)}
          names={selected.map((c) => c.name)}
          subtitles={selected.map((c) => getObjectiveLabel(c.objective))}
          getVal={(id, key) => {
            const c = selected.find((x) => x.id === id);
            return c ? getMetricValue(c, key) : 0;
          }}
          onRemove={(id) => setSelectedIds((prev) => prev.filter((x) => x !== id))}
        />
      ) : (
        <EmptyComparison />
      )}
    </div>
  );
}

function InsightsTab({
  level,
  preset,
  getEntity,
}: {
  level: 'adset' | 'ad';
  preset: string;
  getEntity: (ins: InsightsData) => { id: string; name: string; parentName: string };
}) {
  const { items, loading, error } = useComparatorItems(level, preset);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const entities = useMemo(
    () =>
      items.map((ins) => ({ ...getEntity(ins), ins })),
    [items, getEntity]
  );

  const selectedEntities = useMemo(
    () => entities.filter((e) => selectedIds.includes(e.id)),
    [entities, selectedIds]
  );

  const insightsMap = useMemo(() => {
    const map: Record<string, InsightsData> = {};
    for (const e of entities) map[e.id] = e.ins;
    return map;
  }, [entities]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-xs font-medium text-white mb-3">Seleccioná elementos para comparar</p>
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-10 w-40 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="text-xs text-rose-400">{error}</p>
        ) : entities.length === 0 ? (
          <p className="text-xs text-white/30">No hay datos disponibles</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entities.map((e, i) => {
              const idx = selectedIds.indexOf(e.id);
              const isSel = idx !== -1;
              return (
                <button
                  key={e.id}
                  onClick={() => toggle(e.id)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all flex items-start gap-1.5 text-left',
                    isSel
                      ? `${COLORS[idx]} border-current bg-current/10`
                      : 'text-white/40 border-white/[0.06] hover:border-white/20 hover:text-white/70'
                  )}
                >
                  {isSel && <span className="font-bold shrink-0">{idx + 1}.</span>}
                  <div className="min-w-0">
                    <div className="truncate max-w-[200px]">{e.name}</div>
                    <div className="text-[10px] opacity-60 truncate max-w-[200px]">{e.parentName}</div>
                  </div>
                  {isSel && <X className="w-3 h-3 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedEntities.length >= 2 ? (
        <ComparisonTable
          selectedIds={selectedEntities.map((e) => e.id)}
          names={selectedEntities.map((e) => e.name)}
          subtitles={selectedEntities.map((e) => e.parentName)}
          getVal={(id, key) => {
            const ins = insightsMap[id];
            return ins ? getMetricValueFromInsights(ins, key) : 0;
          }}
          onRemove={(id) => setSelectedIds((prev) => prev.filter((x) => x !== id))}
        />
      ) : (
        <EmptyComparison />
      )}
    </div>
  );
}

function EmptyComparison() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
        <GitCompare className="w-5 h-5 text-white/20" />
      </div>
      <p className="text-sm text-white/40">Seleccioná al menos 2 elementos</p>
      <p className="text-xs text-white/20">Podés comparar hasta 4 simultáneamente</p>
    </div>
  );
}

export default function ComparePage() {
  const [preset, setPreset] = useState('last_30d');
  const [activeTab, setActiveTab] = useState<TabKey>('campaigns');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Comparador"
        subtitle="Compará hasta 4 elementos"
        showDatePicker
        datePreset={preset}
        onDateChange={(p) => setPreset(p)}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
          {(['campaigns', 'adsets', 'ads'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              {tab === 'campaigns' ? 'Campañas' : tab === 'adsets' ? 'Conjuntos' : 'Creativos'}
            </button>
          ))}
        </div>

        {activeTab === 'campaigns' && <CampaignsTab preset={preset} />}
        {activeTab === 'adsets' && (
          <InsightsTab
            level="adset"
            preset={preset}
            getEntity={(ins) => ({
              id: ins.adset_id || '',
              name: ins.adset_name || 'Sin nombre',
              parentName: ins.campaign_name || '',
            })}
          />
        )}
        {activeTab === 'ads' && (
          <InsightsTab
            level="ad"
            preset={preset}
            getEntity={(ins) => ({
              id: ins.ad_id || '',
              name: ins.ad_name || 'Sin nombre',
              parentName: ins.adset_name || '',
            })}
          />
        )}
      </div>
    </div>
  );
}
