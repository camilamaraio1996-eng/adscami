'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { CampaignsTable } from '@/components/campaigns/campaigns-table';
import { CampaignFilters } from '@/components/campaigns/campaign-filters';
import { useCampaigns } from '@/hooks/use-meta-data';
import type { CampaignStatus } from '@/types/meta';

export default function CampaignsPage() {
  const [preset, setPreset] = useState('last_30d');
  const [customSince, setCustomSince] = useState<string | undefined>();
  const [customUntil, setCustomUntil] = useState<string | undefined>();
  const [statuses, setStatuses] = useState<CampaignStatus[]>(['ACTIVE', 'PAUSED']);

  const { campaigns, loading, error, refetch } = useCampaigns(preset, customSince, customUntil);

  const handleDateChange = (p: string, since?: string, until?: string) => {
    setPreset(p);
    setCustomSince(since);
    setCustomUntil(until);
  };

  const filteredCampaigns = statuses.length
    ? campaigns.filter((c) => statuses.includes(c.status as CampaignStatus))
    : campaigns;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Campañas"
        subtitle={`${filteredCampaigns.length} campañas encontradas`}
        onRefresh={refetch}
        loading={loading}
        showDatePicker
        datePreset={preset}
        onDateChange={handleDateChange}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <CampaignFilters
          statuses={statuses}
          onStatusChange={setStatuses}
        />

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}

        <CampaignsTable campaigns={filteredCampaigns} loading={loading} />
      </div>
    </div>
  );
}
