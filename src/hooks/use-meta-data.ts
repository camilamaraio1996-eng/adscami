'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CampaignWithInsights, InsightsData, DailyInsights } from '@/types/meta';
import { getDateRangeParams } from '@/lib/analytics';
import { MOCK_CAMPAIGNS, generateMockDailyInsights } from '@/lib/mock-data';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function useCampaigns(preset = 'last_30d', customSince?: string, customUntil?: string) {
  const [campaigns, setCampaigns] = useState<CampaignWithInsights[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        setCampaigns(MOCK_CAMPAIGNS);
        return;
      }
      const { since, until } = getDateRangeParams(preset, customSince, customUntil);
      const res = await window.fetch(`/api/meta/campaigns?since=${since}&until=${until}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar campañas');
      setCampaigns(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [preset, customSince, customUntil]);

  useEffect(() => { fetch(); }, [fetch]);

  return { campaigns, loading, error, refetch: fetch };
}

export function useCampaignDetail(
  id: string,
  preset = 'last_30d',
  customSince?: string,
  customUntil?: string
) {
  const [data, setData] = useState<{
    campaign: CampaignWithInsights | null;
    insights: InsightsData | null;
    daily_insights: DailyInsights[];
    adset_insights: InsightsData[];
    ad_insights: InsightsData[];
  }>({ campaign: null, insights: null, daily_insights: [], adset_insights: [], ad_insights: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        const campaign = MOCK_CAMPAIGNS.find((c) => c.id === id) || null;
        setData({
          campaign,
          insights: campaign?.insights || null,
          daily_insights: generateMockDailyInsights(id),
          adset_insights: [],
          ad_insights: [],
        });
        return;
      }
      const { since, until } = getDateRangeParams(preset, customSince, customUntil);
      const res = await window.fetch(`/api/meta/campaigns/${id}?since=${since}&until=${until}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al cargar campaña');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [id, preset, customSince, customUntil]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, error, refetch: fetch };
}

export function useAccountInsights(preset = 'last_30d', customSince?: string, customUntil?: string) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 400));
        // Aggregate mock data
        const agg = MOCK_CAMPAIGNS.reduce(
          (acc, c) => {
            if (!c.insights) return acc;
            acc.spend += parseFloat(c.insights.spend || '0');
            acc.impressions += parseInt(c.insights.impressions || '0', 10);
            acc.reach += parseInt(c.insights.reach || '0', 10);
            acc.clicks += parseInt(c.insights.clicks || '0', 10);
            return acc;
          },
          { spend: 0, impressions: 0, reach: 0, clicks: 0 }
        );
        const ctr = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0;
        const cpc = agg.clicks > 0 ? agg.spend / agg.clicks : 0;
        const cpm = agg.impressions > 0 ? (agg.spend / agg.impressions) * 1000 : 0;
        setInsights({
          spend: agg.spend.toFixed(2),
          impressions: agg.impressions.toString(),
          reach: agg.reach.toString(),
          clicks: agg.clicks.toString(),
          ctr: ctr.toFixed(4),
          cpc: cpc.toFixed(2),
          cpm: cpm.toFixed(2),
          frequency: '1.40',
          date_start: '2025-04-12',
          date_stop: '2025-05-12',
        });
        return;
      }
      const { since, until } = getDateRangeParams(preset, customSince, customUntil);
      const res = await window.fetch(`/api/meta/report?since=${since}&until=${until}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setInsights(json.account_insights);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [preset, customSince, customUntil]);

  useEffect(() => { fetch(); }, [fetch]);

  return { insights, loading, error, refetch: fetch };
}
