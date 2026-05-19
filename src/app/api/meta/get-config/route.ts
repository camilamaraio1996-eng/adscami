import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();

  const hasCookieToken = !!cookieStore.get('meta_token')?.value;
  const hasEnvToken = !!process.env.META_ACCESS_TOKEN;
  const hasToken = hasCookieToken || hasEnvToken;

  const accountId =
    cookieStore.get('meta_account_id')?.value ||
    process.env.META_AD_ACCOUNT_ID ||
    '';

  const apiVersion =
    cookieStore.get('meta_api_version')?.value ||
    process.env.META_API_VERSION ||
    'v21.0';

  const source: 'env' | 'cookie' | 'none' = hasCookieToken
    ? 'cookie'
    : hasEnvToken
    ? 'env'
    : 'none';

  return NextResponse.json({ hasToken, accountId, apiVersion, source });
}
