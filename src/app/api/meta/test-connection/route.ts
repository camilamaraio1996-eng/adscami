import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/meta-api';

export async function GET() {
  const result = await testConnection();
  if (result.success) {
    return NextResponse.json(result);
  }
  return NextResponse.json(result, { status: 400 });
}
