import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { token, accountId, apiVersion, claudeKey } = await req.json();
    const cookieStore = await cookies();

    const opts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24 * 60,
      path: '/',
    };

    if (token) cookieStore.set('meta_token', token, opts);
    if (accountId) cookieStore.set('meta_account_id', accountId, opts);
    cookieStore.set('meta_api_version', apiVersion || 'v21.0', opts);
    if (claudeKey) cookieStore.set('claude_api_key', claudeKey, opts);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Error al guardar configuración' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('meta_token');
    cookieStore.delete('meta_account_id');
    cookieStore.delete('meta_api_version');
    cookieStore.delete('claude_api_key');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Error al limpiar configuración' }, { status: 500 });
  }
}
