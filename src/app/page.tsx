'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  ShoppingCart,
  Target,
  AlertTriangle,
  Brain,
  Activity,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SpendChart, CtrCpcChart } from '@/components/dashboard/spend-chart';
import { CampaignsTable } from '@/components/campaigns/campaigns-table';
import { useAccountInsights, useCampaigns } from '@/hooks/use-meta-data';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getActionValue,
} from '@/lib/analytics';
import { generateMockDailyInsights } from '@/lib/mock-data';
import { generatePortfolioAnalysis } from '@/lib/intelligence';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const priorityColors = {
  critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-white/[0.06] text-white/40 border-white/[0.1]',
};

function HealthScore({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80
      ? 'text-emerald-400'
      : score >= 60
      ? 'text-blue-400'
      : score >= 40
      ? 'text-amber-400'
      : 'text-rose-400';

  const ringColor =
    score >= 80
      ? 'border-emerald-500/40'
      : score >= 60
      ? 'border-blue-500/40'
      : score >= 40
      ? 'border-amber-500/40'
      : 'border-rose-500/40';

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-14 h-14 rounded-full border-2 flex items-center justify-center',
          ringColor
        )}
      >
        <span className={cn('text-xl font-bold tabular-nums', color)}>{score}</span>
      </div>
      <div>
        <p className="text-xs text-white/40">Salud del portfolio</p>
        <p className={cn('text-sm font-semibold', color)}>{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [preset, setPreset] = useState('last_30d');
  const [customSince, setCustomSince] = useState<string | undefined>();
  const [customUntil, setCustomUntil] = useState<string | undefined>();

  const {
    insights,
    loading: insightsLoading,
    refetch: refetchInsights,
  } = useAccountInsights(preset, customSince, customUntil);
  const {
    campaigns,
    loading: campaignsLoading,
    refetch: refetchCampaigns,
  } = useCampaigns(preset, customSince, customUntil);

  const handleDateChange = (p: string, since?: string, until?: string) => {
    setPreset(p);
    setCustomSince(since);
    setCustomUntil(until);
  };

  const handleRefresh = () => {
    refetchInsights();
    refetchCampaigns();
  };

  const spend = parseFloat(insights?.spend || '0');
  const impressions = parseInt(insights?.impressions || '0', 10);
  const clicks = parseInt(insights?.clicks || '0', 10);
  const ctr = parseFloat(insights?.ctr || '0');
  const cpc = parseFloat(insights?.cpc || '0');
  const cpm = parseFloat(insights?.cpm || '0');
  const leads = getActionValue(insights?.actions, 'lead');
  const purchases = getActionValue(insights?.actions, 'purchase');

  const mockDaily = generateMockDailyInsights('all', 30);

  const analysis = useMemo(
    () => (campaigns.length > 0 ? generatePortfolioAnalysis(campaigns) : null),
    [campaigns]
  );

  const topAlerts = analysis?.alerts.slice(0, 3) || [];
  const criticalAlerts = topAlerts.filter(
    (a) => a.priority === 'critical' || a.priority === 'high'
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Command Center"
        subtitle="Vista general de rendimiento"
        onRefresh={handleRefresh}
        loading={insightsLoading}
        showDatePicker
        datePreset={preset}
        onDateChange={handleDateChange}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Top bar: health + quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Health Score */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between">
            {analysis ? (
              <HealthScore score={analysis.healthScore} label={analysis.healthLabel} />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-white/[0.1] flex items-center justify-center shimmer" />
                <div>
                  <p className="text-xs text-white/30">Salud del portfolio</p>
                  <p className="text-sm text-white/20">Cargando…</p>
                </div>
              </div>
            )}
            <Link
              href="/intelligence"
              className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Brain className="w-3 h-3" />
              Ver AI
            </Link>
          </div>

          {/* Quick stats */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs text-white/30 mb-1">Campañas activas</p>
            <p className="text-2xl font-bold text-white tabular-nums">
              {analysis?.activeCampaigns ?? campaigns.filter((c) => c.status === 'ACTIVE').length}
            </p>
            <p className="text-[10px] text-white/20 mt-1">
              de {analysis?.totalCampaigns ?? campaigns.length} totales
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs text-white/30 mb-1">Conversiones</p>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">
              {formatNumber(leads + purchases)}
            </p>
            <p className="text-[10px] text-white/20 mt-1">
              {formatNumber(leads)} leads · {formatNumber(purchases)} compras
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-white/20" />
              <p className="text-xs text-white/30">Alertas activas</p>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {analysis?.alerts.length ?? 0}
            </p>
            <p className="text-[10px] text-rose-400 mt-1">
              {criticalAlerts.length} requieren atención
            </p>
          </div>
        </div>

        {/* Alert strip */}
        {criticalAlerts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-xs text-white/40">Alertas prioritarias:</span>
            {criticalAlerts.map((alert) => (
              <span
                key={alert.id}
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-full border',
                  priorityColors[alert.priority]
                )}
              >
                {alert.title}
              </span>
            ))}
            <Link
              href="/intelligence"
              className="text-[11px] text-violet-400 hover:text-violet-300 underline"
            >
              Ver todas
            </Link>
          </div>
        )}

        {/* KPI grid: 6 metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Gasto total"
            value={formatCurrency(spend)}
            icon={DollarSign}
            color="blue"
            loading={insightsLoading}
          />
          <MetricCard
            label="Impresiones"
            value={formatNumber(impressions)}
            icon={Eye}
            color="violet"
            loading={insightsLoading}
          />
          <MetricCard
            label="Clics"
            value={formatNumber(clicks)}
            icon={MousePointerClick}
            color="default"
            loading={insightsLoading}
          />
          <MetricCard
            label="CTR"
            value={formatPercent(ctr)}
            subValue="Tasa de clic"
            icon={TrendingUp}
            color={ctr >= 1.5 ? 'green' : ctr >= 0.8 ? 'orange' : 'rose'}
            loading={insightsLoading}
          />
          <MetricCard
            label="CPC"
            value={formatCurrency(cpc)}
            subValue="Costo por clic"
            color={cpc > 0 && cpc < 1 ? 'green' : cpc < 3 ? 'orange' : 'rose'}
            loading={insightsLoading}
          />
          <MetricCard
            label="CPM"
            value={formatCurrency(cpm)}
            subValue="Por mil impresiones"
            loading={insightsLoading}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SpendChart data={mockDaily} title="Gasto diario" />
          <CtrCpcChart data={mockDaily} />
        </div>

        {/* Bottom: campaigns + insights preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Campaigns mini-table */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white">Campañas</p>
              <Link
                href="/campaigns"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Ver todas →
              </Link>
            </div>
            <CampaignsTable campaigns={campaigns} loading={campaignsLoading} compact />
          </div>

          {/* AI Insights preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-violet-400" />
                <p className="text-sm font-medium text-white">Insights AI</p>
              </div>
              <Link
                href="/intelligence"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Ver más →
              </Link>
            </div>
            {analysis && analysis.insights.length > 0 ? (
              <div className="space-y-2">
                {analysis.insights.slice(0, 4).map((insight) => (
                  <div
                    key={insight.id}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base">{insight.emoji}</span>
                      <div>
                        <p className="text-[12px] font-semibold text-white">{insight.title}</p>
                        <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">
                          {insight.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
                <Brain className="w-8 h-8 text-violet-500/30 mx-auto mb-2" />
                <p className="text-xs text-white/30">
                  Cargando análisis AI…
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
