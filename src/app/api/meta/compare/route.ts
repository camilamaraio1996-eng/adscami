import { NextResponse } from 'next/server';
import { getAccountLevelInsights } from '@/lib/meta-api';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level') as 'adset' | 'ad';
    const since = searchParams.get('since') || '';
    const until = searchParams.get('until') || '';
    if (!level || !since || !until) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }
    const data = await getAccountLevelInsights({ since, until }, level);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
