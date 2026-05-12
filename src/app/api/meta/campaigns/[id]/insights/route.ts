import { NextRequest, NextResponse } from 'next/server';
import { getCampaignInsights, getCampaignDailyInsights } from '@/lib/meta-api';
import type { DateRange } from '@/types/meta';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const since = searchParams.get('since') || getDefaultSince();
    const until = searchParams.get('until') || getDefaultUntil();
    const level = (searchParams.get('level') || 'campaign') as 'campaign' | 'adset' | 'ad';
    const daily = searchParams.get('daily') === 'true';
    const dateRange: DateRange = { since, until };

    const insights = daily
      ? await getCampaignDailyInsights(id, dateRange)
      : await getCampaignInsights(id, dateRange, level);

    return NextResponse.json({ data: insights });
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
