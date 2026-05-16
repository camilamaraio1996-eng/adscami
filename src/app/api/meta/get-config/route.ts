import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();

  const hasEnvToken = !!process.env.META_ACCESS_TOKEN;
  const hasCookieToken = !!cookieStore.get('meta_token')?.value;
  const hasToken = hasEnvToken || hasCookieToken;

  const accountId =
    process.env.META_AD_ACCOUNT_ID ||
    cookieStore.get('meta_account_id')?.value ||
    '';

  const apiVersion =
    process.env.META_API_VERSION ||
    cookieStore.get('meta_api_version')?.value ||
    'v21.0';

  const source: 'env' | 'cookie' | 'none' = hasEnvToken
    ? 'env'
    : hasCookieToken
    ? 'cookie'
    : 'none';

  return NextResponse.json({ hasToken, accountId, apiVersion, source });
}
