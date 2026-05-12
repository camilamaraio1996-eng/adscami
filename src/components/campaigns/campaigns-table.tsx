'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Search, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { CampaignWithInsights } from '@/types/meta';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getObjectiveLabel,
  getStatusLabel,
  getRoas,
  getActionValue,
} from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface CampaignsTableProps {
  campaigns: CampaignWithInsights[];
  loading?: boolean;
  compact?: boolean;
}

type SortKey = 'name' | 'spend' | 'ctr' | 'cpc' | 'cpm' | 'results' | 'roas' | 'frequency';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PAUSED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ARCHIVED: 'bg-white/5 text-white/40 border-white/10',
  DELETED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export function CampaignsTable({ campaigns, loading, compact }: CampaignsTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let result = campaigns;
    if (search) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return [...result].sort((a, b) => {
      const getVal = (c: CampaignWithInsights): number => {
        const ins = c.insights;
        if (!ins) return 0;
        switch (sortKey) {
          case 'spend': return parseFloat(ins.spend || '0');
          case 'ctr': return parseFloat(ins.ctr || '0');
          case 'cpc': return parseFloat(ins.cpc || '0');
          case 'cpm': return parseFloat(ins.cpm || '0');
          case 'results': return getActionValue(ins.actions, 'lead') + getActionValue(ins.actions, 'purchase') + getActionValue(ins.actions, 'messaging_conversation_started_7d');
          case 'roas': return getRoas(ins.purchase_roas) || 0;
          case 'frequency': return parseFloat(ins.frequency || '0');
          default: return 0;
        }
      };
      if (sortKey === 'name') {
        return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const diff = getVal(a) - getVal(b);
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [campaigns, search, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-400" />
      : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  const Th = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="px-3 py-2.5 text-left text-xs text-white/40 font-medium cursor-pointer hover:text-white/60 whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">{label}<SortIcon col={col} /></span>
    </th>
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <Skeleton className="h-8 w-56 bg-white/[0.06]" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-white/[0.04] flex gap-4">
            <Skeleton className="h-4 w-48 bg-white/[0.04]" />
            <Skeleton className="h-4 w-16 bg-white/[0.04]" />
            <Skeleton className="h-4 w-16 bg-white/[0.04]" />
            <Skeleton className="h-4 w-16 bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
          <Search className="w-5 h-5 text-white/20" />
        </div>
        <p className="text-sm text-white/40">Sin campañas encontradas</p>
        <p className="text-xs text-white/20">Verificá la configuración del token y el rango de fechas</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      {!compact && (
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Buscar campaña..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.06] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
          </div>
          <p className="text-xs text-white/30 ml-auto">{filtered.length} campañas</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/[0.02] border-b border-white/[0.06]">
            <tr>
              <Th col="name" label="Campaña" />
              <th className="px-3 py-2.5 text-left text-xs text-white/40 font-medium">Estado</th>
              {!compact && <th className="px-3 py-2.5 text-left text-xs text-white/40 font-medium">Objetivo</th>}
              <Th col="spend" label="Gasto" />
              <Th col="results" label="Resultados" />
              <Th col="ctr" label="CTR" />
              <Th col="cpc" label="CPC" />
              <Th col="cpm" label="CPM" />
              <Th col="roas" label="ROAS" />
              <Th col="frequency" label="Freq." />
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((campaign) => {
              const ins = campaign.insights;
              const spend = parseFloat(ins?.spend || '0');
              const ctr = parseFloat(ins?.ctr || '0');
              const cpc = parseFloat(ins?.cpc || '0');
              const cpm = parseFloat(ins?.cpm || '0');
              const freq = parseFloat(ins?.frequency || '0');
              const roas = getRoas(ins?.purchase_roas);
              const leads = getActionValue(ins?.actions, 'lead');
              const purchases = getActionValue(ins?.actions, 'purchase');
              const msgs = getActionValue(ins?.actions, 'messaging_conversation_started_7d');
              const results = leads + purchases + msgs;

              return (
                <tr
                  key={campaign.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-3">
                    <p className="text-xs font-medium text-white truncate max-w-[200px]">{campaign.name}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', STATUS_COLORS[campaign.status] || STATUS_COLORS.ARCHIVED)}>
                      {getStatusLabel(campaign.status)}
                    </span>
                  </td>
                  {!compact && (
                    <td className="px-3 py-3">
                      <span className="text-xs text-white/40">{getObjectiveLabel(campaign.objective)}</span>
                    </td>
                  )}
                  <td className="px-3 py-3 text-xs text-white font-medium">{formatCurrency(spend)}</td>
                  <td className="px-3 py-3 text-xs text-white">{formatNumber(results)}</td>
                  <td className="px-3 py-3">
                    <span className={cn('text-xs font-medium', ctr >= 1.5 ? 'text-emerald-400' : ctr >= 0.8 ? 'text-yellow-400' : 'text-rose-400')}>
                      {formatPercent(ctr)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-white/70">{formatCurrency(cpc)}</td>
                  <td className="px-3 py-3 text-xs text-white/70">{formatCurrency(cpm)}</td>
                  <td className="px-3 py-3">
                    {roas !== null ? (
                      <span className={cn('text-xs font-medium', roas >= 2 ? 'text-emerald-400' : roas >= 1 ? 'text-yellow-400' : 'text-rose-400')}>
                        {roas.toFixed(2)}x
                      </span>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn('text-xs', freq > 3 ? 'text-rose-400' : freq > 2 ? 'text-yellow-400' : 'text-white/60')}>
                      {freq > 0 ? freq.toFixed(1) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="text-white/30 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
