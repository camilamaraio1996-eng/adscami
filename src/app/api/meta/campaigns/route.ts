import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns, getCampaignInsights } from '@/lib/meta-api';
import type { CampaignStatus, DateRange } from '@/types/meta';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const since = searchParams.get('since') || getDefaultSince();
    const until = searchParams.get('until') || getDefaultUntil();
    const statusParam = searchParams.get('statuses');
    const statuses = statusParam
      ? (statusParam.split(',') as CampaignStatus[])
      : (['ACTIVE', 'PAUSED'] as CampaignStatus[]);

    const dateRange: DateRange = { since, until };
    const campaigns = await getCampaigns(statuses, dateRange);

    const withInsights = await Promise.all(
      campaigns.map(async (c) => {
        try {
          const insights = await getCampaignInsights(c.id, dateRange, 'campaign');
          return { ...c, insights: insights[0] || null };
        } catch {
          return { ...c, insights: null };
        }
      })
    );

    return NextResponse.json({ data: withInsights });
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
