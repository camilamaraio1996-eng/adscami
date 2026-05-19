import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const apiKey = cookieStore.get('claude_api_key')?.value || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Claude API key no configurada' }, { status: 401 });
    }

    const { message, portfolioContext, campaigns } = await req.json();

    const client = new Anthropic({ apiKey });

    const systemPrompt = `Sos un experto analista de Meta Ads. Tenés acceso a los datos reales del portfolio del usuario.

DATOS DEL PORTFOLIO:
${JSON.stringify(portfolioContext, null, 2)}

CAMPAÑAS (${campaigns?.length || 0} campañas):
${JSON.stringify(
  campaigns?.slice(0, 10).map((c: any) => ({
    name: c.name,
    status: c.status,
    spend: c.insights?.spend,
    ctr: c.insights?.ctr,
    cpc: c.insights?.cpc,
    roas: c.insights?.purchase_roas,
    frequency: c.insights?.frequency,
    conversions: c.insights?.actions?.find((a: any) => a.action_type === 'purchase')?.value,
  })),
  null, 2
)}

INSTRUCCIONES:
- Respondé en español rioplatense (vos, etc.)
- Sé específico y usa los datos reales del portfolio
- Dá recomendaciones concretas y accionables
- Respuestas concisas (máximo 4-5 oraciones)
- No inventes datos que no están en el contexto`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ response: text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al consultar Claude' },
      { status: 500 }
    );
  }
}
