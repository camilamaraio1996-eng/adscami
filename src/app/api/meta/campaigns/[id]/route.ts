import { NextRequest, NextResponse } from 'next/server';
import { getCampaign, getCampaignInsights, getCampaignDailyInsights, getAdSetInsights, getAdInsights } from '@/lib/meta-api';
import type { DateRange } from '@/types/meta';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const since = searchParams.get('since') || getDefaultSince();
    const until = searchParams.get('until') || getDefaultUntil();
    const dateRange: DateRange = { since, until };

    const [campaign, insights, dailyInsights, adsetInsights, adInsights] = await Promise.all([
      getCampaign(id),
      getCampaignInsights(id, dateRange, 'campaign'),
      getCampaignDailyInsights(id, dateRange),
      getAdSetInsights(id, dateRange),
      getAdInsights(id, dateRange),
    ]);

    return NextResponse.json({
      campaign,
      insights: insights[0] || null,
      daily_insights: dailyInsights,
      adset_insights: adsetInsights,
      ad_insights: adInsights,
    });
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
