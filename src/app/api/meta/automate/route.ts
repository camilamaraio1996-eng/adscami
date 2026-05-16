import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { action, entityId, entityType, params } = await req.json() as {
      action: string;
      entityId: string | null;
      entityType: string;
      params: Record<string, unknown>;
    };

    const cookieStore = await cookies();
    const token = cookieStore.get('meta_token')?.value || process.env.META_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json({ error: 'No hay token configurado. Configuralo en Ajustes.' }, { status: 401 });
    }

    // For bulk/report actions that don't need a real API call
    if (!entityId || entityType === 'bulk' || action === 'create_report' || action === 'refresh_creatives') {
      return NextResponse.json({
        success: true,
        result: { message: `Acción "${action}" registrada. En producción, esto ejecutaría cambios reales en tu cuenta.` },
      });
    }

    const version = cookieStore.get('meta_api_version')?.value || process.env.META_API_VERSION || 'v21.0';
    const BASE_URL = `https://graph.facebook.com/${version}`;

    let body: Record<string, string> = {};
    if (action === 'pause') body = { status: 'PAUSED' };
    else if (action === 'resume') body = { status: 'ACTIVE' };
    else if (action === 'update_budget') {
      const budget = params?.budget;
      if (budget !== undefined) {
        body = { daily_budget: String(budget) };
      }
    }

    const formData = new URLSearchParams({ ...body, access_token: token });
    const res = await fetch(`${BASE_URL}/${entityId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await res.json() as { error?: { message?: string } };

    if (!res.ok || data.error) {
      return NextResponse.json(
        { error: data.error?.message || 'Error de API de Meta' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    );
  }
}
