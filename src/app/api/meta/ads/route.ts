import { NextRequest, NextResponse } from 'next/server';
import { getAds, getAdInsights } from '@/lib/meta-api';
import type { DateRange } from '@/types/meta';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const campaignId = searchParams.get('campaign_id');
    const since = searchParams.get('since') || getDefaultSince();
    const until = searchParams.get('until') || getDefaultUntil();
    if (!campaignId) return NextResponse.json({ error: 'campaign_id requerido' }, { status: 400 });

    const dateRange: DateRange = { since, until };
    const [ads, insights] = await Promise.all([
      getAds(campaignId),
      getAdInsights(campaignId, dateRange),
    ]);

    const insightsMap = new Map(insights.map((i) => [i.ad_id, i]));
    const data = ads.map((a) => ({ ...a, insights: insightsMap.get(a.id) || null }));

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
}

function getDefaultSince() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function getDefaultUntil() {
  return new Date().toISOString().split('T')[0];
}
