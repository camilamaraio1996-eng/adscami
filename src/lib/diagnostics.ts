import type { InsightsData, DailyInsights, Diagnostic, CampaignScore } from '@/types/meta';
import { getActionValue, getActionCost, getRoas } from './analytics';

export function analyzeCampaign(
  insights: InsightsData,
  dailyInsights?: DailyInsights[]
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const spend = parseFloat(insights.spend || '0');
  const impressions = parseInt(insights.impressions || '0', 10);
  const clicks = parseInt(insights.clicks || '0', 10);
  const ctr = parseFloat(insights.ctr || '0');
  const cpc = parseFloat(insights.cpc || '0');
  const cpm = parseFloat(insights.cpm || '0');
  const frequency = parseFloat(insights.frequency || '0');
  const leads = getActionValue(insights.actions, 'lead');
  const purchases = getActionValue(insights.actions, 'purchase');
  const landingViews = getActionValue(insights.actions, 'landing_page_view');
  const conversions = leads + purchases;
  const costPerLead = getActionCost(insights.cost_per_action_type, 'lead');
  const costPerPurchase = getActionCost(insights.cost_per_action_type, 'purchase');
  const roas = getRoas(insights.purchase_roas || insights.website_purchase_roas);

  if (ctr < 1 && impressions > 1000) {
    diagnostics.push({
      id: 'low_ctr',
      severity: 'alta',
      problem: 'CTR muy bajo (< 1%)',
      explanation: `Tu CTR es ${ctr.toFixed(2)}%, lo que indica que el anuncio no está captando la atención del público objetivo.`,
      recommendation: 'Renovar creatividades, probar nuevos formatos (video, carrusel) y revisar el copy de los primeros 3 segundos.',
      action: 'Crear 3 variantes nuevas de creatividad y testear durante 7 días.',
    });
  }

  if (cpc > 0 && ctr < 1.5) {
    diagnostics.push({
      id: 'high_cpc_low_ctr',
      severity: 'alta',
      problem: 'CPC alto con CTR bajo',
      explanation: `Estás pagando $${cpc.toFixed(2)} por clic con un CTR de ${ctr.toFixed(2)}%. Problema de anuncio, copy o creatividad.`,
      recommendation: 'Revisar el hook visual del anuncio, la primera línea del copy y el CTA.',
      action: 'Reescribir el copy con un gancho más directo y emocional. Probar nuevo titular.',
    });
  }

  if (cpm > 15 && spend > 50) {
    diagnostics.push({
      id: 'high_cpm',
      severity: 'media',
      problem: `CPM elevado ($${cpm.toFixed(2)})`,
      explanation: 'El costo por cada 1000 impresiones es alto, lo que indica audiencia muy competida o segmentación demasiado pequeña.',
      recommendation: 'Ampliar la audiencia, probar lookalike más amplio o reducir capas de segmentación.',
      action: 'Testear audiencia amplia (sin intereses) vs audiencia segmentada para comparar CPM.',
    });
  }

  if (frequency > 3 && conversions === 0 && spend > 100) {
    diagnostics.push({
      id: 'ad_fatigue',
      severity: 'alta',
      problem: `Fatiga publicitaria (frecuencia ${frequency.toFixed(1)})`,
      explanation: 'La misma persona ve tu anuncio más de 3 veces y no convierte. Saturación de audiencia.',
      recommendation: 'Pausar el anuncio, rotar creatividades o ampliar audiencia urgente.',
      action: 'Pausar anuncios actuales y lanzar nuevas creatividades con diferente ángulo de mensaje.',
    });
  }

  if (frequency > 3 && conversions > 0) {
    diagnostics.push({
      id: 'frequency_warning',
      severity: 'media',
      problem: `Frecuencia alta (${frequency.toFixed(1)})`,
      explanation: 'La audiencia está viendo el anuncio repetidamente. Riesgo de fatiga próxima.',
      recommendation: 'Preparar nuevas creatividades para rotación antes de que baje el rendimiento.',
      action: 'Crear 2-3 variantes de anuncio para mantener frescura de la campaña.',
    });
  }

  if (spend > 200 && conversions === 0) {
    diagnostics.push({
      id: 'spend_no_conversions',
      severity: 'alta',
      problem: 'Gasto alto sin conversiones',
      explanation: `Se invirtieron $${spend.toFixed(2)} sin obtener ninguna conversión registrada.`,
      recommendation: 'Verificar que el pixel/evento de conversión esté correctamente instalado. Revisar la landing page y la oferta.',
      action: 'Auditar el píxel con Meta Pixel Helper. Revisar que el evento esté disparando correctamente.',
    });
  }

  if (roas !== null && roas < 1 && spend > 50) {
    diagnostics.push({
      id: 'low_roas',
      severity: 'alta',
      problem: `ROAS negativo (${roas.toFixed(2)}x)`,
      explanation: 'Por cada peso invertido estás obteniendo menos de $1 en ventas. La campaña no es rentable.',
      recommendation: 'Pausar o reducir presupuesto. Revisar precio de producto, checkout y la audiencia.',
      action: 'Analizar el embudo completo: anuncio → landing → checkout. Identificar dónde se pierde el usuario.',
    });
  }

  if (ctr > 2 && conversions === 0 && spend > 100) {
    diagnostics.push({
      id: 'high_ctr_no_conv',
      severity: 'alta',
      problem: 'CTR alto pero sin conversiones',
      explanation: `CTR de ${ctr.toFixed(2)}% indica interés, pero nadie convierte. Problema post-clic.`,
      recommendation: 'Revisar landing page, formulario, tiempo de carga y la coherencia entre el anuncio y la página.',
      action: 'Auditar la landing page en mobile. Verificar velocidad de carga y que el formulario funcione correctamente.',
    });
  }

  if (clicks > 100 && leads === 0 && landingViews > 0) {
    diagnostics.push({
      id: 'clicks_no_leads',
      severity: 'alta',
      problem: 'Muchos clics pero ningún lead',
      explanation: 'Las personas hacen clic pero no completan el formulario o la acción esperada.',
      recommendation: 'Simplificar el formulario, mejorar el copy de la landing y verificar que el CTA sea claro.',
      action: 'Reducir campos del formulario a lo mínimo indispensable (nombre, teléfono).',
    });
  }

  if (cpm < 3 && ctr < 0.5 && impressions > 5000) {
    diagnostics.push({
      id: 'low_cpm_low_ctr',
      severity: 'media',
      problem: 'CPM bajo pero CTR muy bajo',
      explanation: 'El inventario es barato pero el anuncio no genera ningún interés. Problema de creatividad.',
      recommendation: 'Aprovechar el bajo CPM con creatividades más llamativas. Testear video vs imagen estática.',
      action: 'Crear un video corto (15s) con hook directo en los primeros 3 segundos.',
    });
  }

  if (dailyInsights && dailyInsights.length >= 5) {
    const trend = detectCostPerResultTrend(dailyInsights);
    if (trend === 'increasing') {
      diagnostics.push({
        id: 'increasing_cost_trend',
        severity: 'media',
        problem: 'Costo por resultado en aumento',
        explanation: 'El CPC o CPM está subiendo día a día, indicando pérdida de eficiencia de la campaña.',
        recommendation: 'Revisar si la audiencia se está saturando. Considerar refrescar creatividades o ampliar audiencia.',
        action: 'Analizar frecuencia y alcance. Si frecuencia > 2.5, rotar creatividades inmediatamente.',
      });
    }
  }

  if (costPerLead > 0 && costPerLead > 50) {
    diagnostics.push({
      id: 'high_cost_per_lead',
      severity: 'media',
      problem: `Costo por lead muy alto ($${costPerLead.toFixed(2)})`,
      explanation: 'El costo de adquisición de cada lead está por encima de lo rentable para la mayoría de negocios.',
      recommendation: 'Revisar la segmentación, la oferta y el formato del formulario. Testear Lead Ads nativos.',
      action: 'Comparar rendimiento de Lead Ads vs landing page propia para este objetivo.',
    });
  }

  if (costPerPurchase > 0 && costPerPurchase > 100) {
    diagnostics.push({
      id: 'high_cost_per_purchase',
      severity: 'alta',
      problem: `Costo por compra muy alto ($${costPerPurchase.toFixed(2)})`,
      explanation: 'El costo de adquisición por compra es elevado. Puede no ser rentable según el margen del producto.',
      recommendation: 'Revisar la audiencia, la oferta y el proceso de checkout. Testear retargeting.',
      action: 'Crear campaña de retargeting para usuarios que vieron la página de producto sin comprar.',
    });
  }

  return diagnostics;
}

function detectCostPerResultTrend(dailyInsights: DailyInsights[]): 'increasing' | 'stable' | 'decreasing' {
  const costs = dailyInsights
    .slice(-7)
    .map((d) => parseFloat(d.cpc || d.cpm || '0'))
    .filter((v) => v > 0);

  if (costs.length < 3) return 'stable';

  const mid = Math.floor(costs.length / 2);
  const firstHalfAvg = costs.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondHalfAvg = costs.slice(mid).reduce((a, b) => a + b, 0) / (costs.length - mid);

  if (secondHalfAvg > firstHalfAvg * 1.2) return 'increasing';
  if (secondHalfAvg < firstHalfAvg * 0.8) return 'decreasing';
  return 'stable';
}

export function scoreCampaign(
  insights: InsightsData,
  dailyInsights?: DailyInsights[]
): CampaignScore {
  const ctr = parseFloat(insights.ctr || '0');
  const cpc = parseFloat(insights.cpc || '0');
  const cpm = parseFloat(insights.cpm || '0');
  const frequency = parseFloat(insights.frequency || '0');
  const leads = getActionValue(insights.actions, 'lead');
  const purchases = getActionValue(insights.actions, 'purchase');
  const conversions = leads + purchases;
  const spend = parseFloat(insights.spend || '0');
  const impressions = parseInt(insights.impressions || '0', 10);
  const roas = getRoas(insights.purchase_roas || insights.website_purchase_roas);
  const reasons: string[] = [];

  // CTR score (0-15)
  let ctrScore = 0;
  if (ctr >= 3) ctrScore = 15;
  else if (ctr >= 2) ctrScore = 12;
  else if (ctr >= 1.5) ctrScore = 10;
  else if (ctr >= 1) ctrScore = 7;
  else if (ctr >= 0.5) ctrScore = 4;
  else ctrScore = 1;
  if (ctrScore < 7) reasons.push(`CTR bajo (${ctr.toFixed(2)}%)`);

  // CPC score (0-15) — lower is better, relative
  let cpcScore = 0;
  if (cpc === 0) cpcScore = 8;
  else if (cpc < 0.3) cpcScore = 15;
  else if (cpc < 0.8) cpcScore = 12;
  else if (cpc < 2) cpcScore = 9;
  else if (cpc < 5) cpcScore = 6;
  else if (cpc < 10) cpcScore = 3;
  else cpcScore = 1;
  if (cpcScore < 6 && cpc > 0) reasons.push(`CPC alto ($${cpc.toFixed(2)})`);

  // CPM score (0-10)
  let cpmScore = 0;
  if (cpm === 0) cpmScore = 5;
  else if (cpm < 3) cpmScore = 10;
  else if (cpm < 7) cpmScore = 8;
  else if (cpm < 12) cpmScore = 6;
  else if (cpm < 20) cpmScore = 4;
  else cpmScore = 2;
  if (cpmScore < 5 && cpm > 0) reasons.push(`CPM elevado ($${cpm.toFixed(2)})`);

  // Frequency score (0-10)
  let freqScore = 0;
  if (frequency === 0) freqScore = 8;
  else if (frequency <= 2) freqScore = 10;
  else if (frequency <= 2.5) freqScore = 8;
  else if (frequency <= 3) freqScore = 5;
  else if (frequency <= 4) freqScore = 3;
  else freqScore = 1;
  if (freqScore < 5 && frequency > 0) reasons.push(`Frecuencia alta (${frequency.toFixed(1)})`);

  // Conversion score (0-25)
  let convScore = 0;
  if (impressions > 0 && spend > 0) {
    if (conversions === 0 && spend > 100) {
      convScore = 0;
      reasons.push('Sin conversiones con gasto significativo');
    } else if (conversions === 0) {
      convScore = 10;
    } else {
      const cpa = spend / conversions;
      if (cpa < 5) convScore = 25;
      else if (cpa < 15) convScore = 20;
      else if (cpa < 30) convScore = 15;
      else if (cpa < 60) convScore = 10;
      else convScore = 5;
    }
  } else {
    convScore = 10;
  }

  // ROAS score (0-15)
  let roasScore = 0;
  if (roas === null) {
    roasScore = 10;
  } else if (roas >= 4) {
    roasScore = 15;
  } else if (roas >= 3) {
    roasScore = 12;
  } else if (roas >= 2) {
    roasScore = 9;
  } else if (roas >= 1) {
    roasScore = 6;
  } else {
    roasScore = 1;
    reasons.push(`ROAS negativo (${roas.toFixed(2)}x)`);
  }

  // Trend score (0-10)
  let trendScore = 8;
  if (dailyInsights && dailyInsights.length >= 5) {
    const trend = detectCostTrend(dailyInsights);
    if (trend === 'increasing') {
      trendScore = 3;
      reasons.push('Tendencia de costo al alza');
    } else if (trend === 'decreasing') {
      trendScore = 10;
    } else {
      trendScore = 7;
    }
  }

  const total = ctrScore + cpcScore + cpmScore + freqScore + convScore + roasScore + trendScore;

  let label: CampaignScore['label'];
  if (total >= 80) label = 'Excelente';
  else if (total >= 65) label = 'Buena';
  else if (total >= 45) label = 'Regular';
  else if (total >= 25) label = 'Mala';
  else label = 'Crítica';

  return {
    total,
    label,
    breakdown: {
      ctr: ctrScore,
      cpc: cpcScore,
      cpm: cpmScore,
      frequency: freqScore,
      costPerResult: convScore,
      roas: roasScore,
      conversion: convScore,
      trend: trendScore,
    },
    reasons,
  };
}

function detectCostTrend(daily: DailyInsights[]): 'increasing' | 'stable' | 'decreasing' {
  const costs = daily
    .slice(-7)
    .map((d) => parseFloat(d.cpc || d.cpm || '0'))
    .filter((v) => v > 0);
  if (costs.length < 3) return 'stable';
  const mid = Math.floor(costs.length / 2);
  const first = costs.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const second = costs.slice(mid).reduce((a, b) => a + b, 0) / (costs.length - mid);
  if (second > first * 1.2) return 'increasing';
  if (second < first * 0.8) return 'decreasing';
  return 'stable';
}

export function generateRecommendations(diagnostics: Diagnostic[]): string[] {
  const recs: string[] = [];
  const ids = new Set(diagnostics.map((d) => d.id));

  if (ids.has('low_ctr') || ids.has('high_cpc_low_ctr')) {
    recs.push('Crear 3 nuevas variantes de creatividad con diferentes hooks visuales');
    recs.push('Reescribir el copy con la fórmula: Problema → Agitación → Solución');
  }
  if (ids.has('ad_fatigue') || ids.has('frequency_warning')) {
    recs.push('Pausar anuncios con frecuencia > 3 y lanzar creatividades frescas');
    recs.push('Ampliar la audiencia objetivo en un 20-30%');
  }
  if (ids.has('spend_no_conversions')) {
    recs.push('Verificar instalación del píxel con Meta Pixel Helper inmediatamente');
    recs.push('Revisar que el evento de conversión esté configurado correctamente');
  }
  if (ids.has('low_roas')) {
    recs.push('Pausar la campaña y revisar el precio del producto vs costo de adquisición');
    recs.push('Testear retargeting con audiencia caliente antes de escalar');
  }
  if (ids.has('high_ctr_no_conv') || ids.has('clicks_no_leads')) {
    recs.push('Auditar la landing page en mobile — revisar velocidad y UX');
    recs.push('Simplificar el formulario a máximo 2-3 campos');
  }
  if (ids.has('high_cpm')) {
    recs.push('Probar audiencia amplia (sin intereses) para bajar el CPM');
    recs.push('Testear Advantage+ Audience de Meta para encontrar mejor segmentación');
  }
  if (ids.has('increasing_cost_trend')) {
    recs.push('Rotar creatividades urgente — el rendimiento está cayendo día a día');
    recs.push('Considerar duplicar la campaña ganadora con nueva audiencia');
  }

  if (recs.length === 0) {
    recs.push('Escalar el presupuesto un 20% si los resultados son consistentes');
    recs.push('Crear una campaña de lookalike basada en los compradores actuales');
    recs.push('Testear nuevos formatos: Reels verticales y Stories para diversificar placements');
  }

  return [...new Set(recs)];
}
