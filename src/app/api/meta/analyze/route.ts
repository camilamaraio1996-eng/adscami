import { NextRequest, NextResponse } from 'next/server';
import { analyzeCampaign, scoreCampaign } from '@/lib/diagnostics';
import type { InsightsData, DailyInsights } from '@/types/meta';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { insights, daily_insights }: { insights: InsightsData; daily_insights?: DailyInsights[] } = body;
    if (!insights) return NextResponse.json({ error: 'insights requerido' }, { status: 400 });

    const diagnostics = analyzeCampaign(insights, daily_insights);
    const score = scoreCampaign(insights, daily_insights);

    return NextResponse.json({ diagnostics, score });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
}
