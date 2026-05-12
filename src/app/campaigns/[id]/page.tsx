'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SpendChart, CtrCpcChart } from '@/components/dashboard/spend-chart';
import { DiagnosticPanel } from '@/components/diagnostics/diagnostic-panel';
import { CampaignScoreCard } from '@/components/campaigns/campaign-score';
import { useCampaignDetail } from '@/hooks/use-meta-data';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getActionValue,
  getStatusLabel,
  getObjectiveLabel,
  getRoas,
} from '@/lib/analytics';
import { analyzeCampaign, scoreCampaign, generateRecommendations } from '@/lib/diagnostics';
import { Skeleton } from '@/components/ui/skeleton';
import type { CampaignScore, Diagnostic } from '@/types/meta';
import { DollarSign, Eye, MousePointerClick, TrendingUp, Target, ShoppingCart } from 'lucide-react';

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [preset, setPreset] = useState('last_30d');
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [score, setScore] = useState<CampaignScore | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const { campaign, insights, daily_insights, adset_insights, ad_insights, loading, error, refetch } =
    useCampaignDetail(id, preset);

  useEffect(() => {
    if (insights) {
      const diag = analyzeCampaign(insights, daily_insights);
      const sc = scoreCampaign(insights, daily_insights);
      const recs = generateRecommendations(diag);
      setDiagnostics(diag);
      setScore(sc);
      setRecommendations(recs);
    }
  }, [insights, daily_insights]);

  const spend = parseFloat(insights?.spend || '0');
  const impressions = parseInt(insights?.impressions || '0', 10);
  const clicks = parseInt(insights?.clicks || '0', 10);
  const ctr = parseFloat(insights?.ctr || '0');
  const cpc = parseFloat(insights?.cpc || '0');
  const cpm = parseFloat(insights?.cpm || '0');
  const freq = parseFloat(insights?.frequency || '0');
  const leads = getActionValue(insights?.actions, 'lead');
  const purchases = getActionValue(insights?.actions, 'purchase');
  const roas = getRoas(insights?.purchase_roas);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title={loading ? 'Cargando...' : (campaign?.name || 'Campaña')}
        subtitle={campaign ? `${getObjectiveLabel(campaign.objective)} · ${getStatusLabel(campaign.status)}` : ''}
        onRefresh={refetch}
        loading={loading}
        showDatePicker
        datePreset={preset}
        onDateChange={(p) => setPreset(p)}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Back link */}
        <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a campañas
        </Link>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}

        {/* Score + metrics row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            {loading ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <Skeleton className="h-20 w-full bg-white/[0.04]" />
              </div>
            ) : score ? (
              <CampaignScoreCard score={score} />
            ) : null}
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <MetricCard label="Gasto total" value={formatCurrency(spend)} icon={DollarSign} color="blue" loading={loading} />
            <MetricCard label="Impresiones" value={formatNumber(impressions)} icon={Eye} loading={loading} />
            <MetricCard label="CTR" value={formatPercent(ctr)} icon={TrendingUp} color={ctr >= 1.5 ? 'green' : ctr >= 0.8 ? 'orange' : 'rose'} loading={loading} />
            <MetricCard label="CPC" value={formatCurrency(cpc)} icon={MousePointerClick} loading={loading} />
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Clics" value={formatNumber(clicks)} loading={loading} />
          <MetricCard label="CPM" value={formatCurrency(cpm)} loading={loading} />
          <MetricCard label="Frecuencia" value={freq.toFixed(2)} loading={loading} />
          <MetricCard label="ROAS" value={roas !== null ? `${roas.toFixed(2)}x` : '—'} color={roas !== null ? (roas >= 2 ? 'green' : roas >= 1 ? 'orange' : 'rose') : 'default'} loading={loading} />
        </div>

        {/* Conversion metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Leads" value={formatNumber(leads)} icon={Target} color="green" loading={loading} />
          <MetricCard label="Compras" value={formatNumber(purchases)} icon={ShoppingCart} color="green" loading={loading} />
          <MetricCard label="Add to Cart" value={formatNumber(getActionValue(insights?.actions, 'add_to_cart'))} loading={loading} />
          <MetricCard label="Checkout iniciado" value={formatNumber(getActionValue(insights?.actions, 'initiate_checkout'))} loading={loading} />
        </div>

        {/* Charts */}
        {daily_insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpendChart data={daily_insights} title="Gasto diario" />
            <CtrCpcChart data={daily_insights} />
          </div>
        )}

        {/* Ad sets breakdown */}
        {adset_insights.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-sm font-medium text-white">Conjuntos de anuncios</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs text-white/40">Nombre</th>
                    <th className="px-4 py-2.5 text-left text-xs text-white/40">Gasto</th>
                    <th className="px-4 py-2.5 text-left text-xs text-white/40">CTR</th>
                    <th className="px-4 py-2.5 text-left text-xs text-white/40">CPC</th>
                    <th className="px-4 py-2.5 text-left text-xs text-white/40">CPM</th>
                  </tr>
                </thead>
                <tbody>
                  {adset_insights.map((ins, i) => (
                    <tr key={i} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs text-white">{ins.adset_name || `Ad Set ${i + 1}`}</td>
                      <td className="px-4 py-3 text-xs text-white/70">{formatCurrency(parseFloat(ins.spend))}</td>
                      <td className="px-4 py-3 text-xs text-white/70">{formatPercent(parseFloat(ins.ctr))}</td>
                      <td className="px-4 py-3 text-xs text-white/70">{formatCurrency(parseFloat(ins.cpc || '0'))}</td>
                      <td className="px-4 py-3 text-xs text-white/70">{formatCurrency(parseFloat(ins.cpm))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Diagnostics */}
        {!loading && insights && (
          <DiagnosticPanel diagnostics={diagnostics} recommendations={recommendations} />
        )}
      </div>
    </div>
  );
}
