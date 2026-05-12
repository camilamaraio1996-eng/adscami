import { NextResponse } from 'next/server';
import { getAdAccounts } from '@/lib/meta-api';

export async function GET() {
  try {
    const accounts = await getAdAccounts();
    return NextResponse.json({ data: accounts });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 });
  }
}
