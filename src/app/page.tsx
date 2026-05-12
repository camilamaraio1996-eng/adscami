'use client';

import { useState } from 'react';
import {
  DollarSign,
  Eye,
  Users,
  MousePointerClick,
  TrendingUp,
  ShoppingCart,
  MessageCircle,
  Target,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SpendChart, CtrCpcChart } from '@/components/dashboard/spend-chart';
import { CampaignsTable } from '@/components/campaigns/campaigns-table';
import { useAccountInsights, useCampaigns } from '@/hooks/use-meta-data';
import { formatCurrency, formatNumber, formatPercent, getActionValue } from '@/lib/analytics';
import { generateMockDailyInsights } from '@/lib/mock-data';

export default function DashboardPage() {
  const [preset, setPreset] = useState('last_30d');
  const [customSince, setCustomSince] = useState<string | undefined>();
  const [customUntil, setCustomUntil] = useState<string | undefined>();

  const { insights, loading: insightsLoading, refetch: refetchInsights } = useAccountInsights(preset, customSince, customUntil);
  const { campaigns, loading: campaignsLoading, refetch: refetchCampaigns } = useCampaigns(preset, customSince, customUntil);

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
  const reach = parseInt(insights?.reach || '0', 10);
  const clicks = parseInt(insights?.clicks || '0', 10);
  const ctr = parseFloat(insights?.ctr || '0');
  const cpc = parseFloat(insights?.cpc || '0');
  const cpm = parseFloat(insights?.cpm || '0');
  const leads = getActionValue(insights?.actions, 'lead');
  const purchases = getActionValue(insights?.actions, 'purchase');
  const messages = getActionValue(insights?.actions, 'messaging_conversation_started_7d');
  const addToCart = getActionValue(insights?.actions, 'add_to_cart');

  const mockDaily = generateMockDailyInsights('all', 30);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Dashboard"
        subtitle="Visión general de tu cuenta publicitaria"
        onRefresh={handleRefresh}
        loading={insightsLoading}
        showDatePicker
        datePreset={preset}
        onDateChange={handleDateChange}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Primary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Gasto total" value={formatCurrency(spend)} icon={DollarSign} color="blue" loading={insightsLoading} />
          <MetricCard label="Impresiones" value={formatNumber(impressions)} icon={Eye} color="violet" loading={insightsLoading} />
          <MetricCard label="Alcance" value={formatNumber(reach)} icon={Users} color="default" loading={insightsLoading} />
          <MetricCard label="Clics" value={formatNumber(clicks)} icon={MousePointerClick} color="default" loading={insightsLoading} />
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <MetricCard label="CPM" value={formatCurrency(cpm)} subValue="Costo por mil" loading={insightsLoading} />
          <MetricCard
            label="Frecuencia"
            value={parseFloat(insights?.frequency || '0').toFixed(2)}
            subValue="Veces promedio"
            loading={insightsLoading}
          />
        </div>

        {/* Conversion metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Leads" value={formatNumber(leads)} icon={Target} color="green" loading={insightsLoading} />
          <MetricCard label="Compras" value={formatNumber(purchases)} icon={ShoppingCart} color="green" loading={insightsLoading} />
          <MetricCard label="Mensajes iniciados" value={formatNumber(messages)} icon={MessageCircle} color="blue" loading={insightsLoading} />
          <MetricCard label="Add to Cart" value={formatNumber(addToCart)} icon={ShoppingCart} color="orange" loading={insightsLoading} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SpendChart data={mockDaily} title="Gasto diario" />
          <CtrCpcChart data={mockDaily} />
        </div>

        {/* Campaigns summary */}
        <div>
          <p className="text-sm font-medium text-white mb-3">Resumen de campañas</p>
          <CampaignsTable campaigns={campaigns} loading={campaignsLoading} compact />
        </div>
      </div>
    </div>
  );
}
