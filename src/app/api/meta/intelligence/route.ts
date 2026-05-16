import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns, getCampaignInsights } from '@/lib/meta-api';
import { generatePortfolioAnalysis } from '@/lib/intelligence';
import type { CampaignWithInsights, DateRange } from '@/types/meta';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const since =
      searchParams.get('since') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const until = searchParams.get('until') || new Date().toISOString().split('T')[0];
    const dateRange: DateRange = { since, until };

    const campaigns = await getCampaigns(['ACTIVE', 'PAUSED'], dateRange);

    const withInsights: CampaignWithInsights[] = await Promise.all(
      campaigns.map(async (c) => {
        try {
          const insights = await getCampaignInsights(c.id, dateRange, 'campaign');
          return { ...c, insights: insights[0] || undefined };
        } catch {
          return { ...c };
        }
      })
    );

    const analysis = generatePortfolioAnalysis(withInsights);

    return NextResponse.json({ data: analysis, campaigns: withInsights });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al generar análisis' },
      { status: 400 }
    );
  }
}
