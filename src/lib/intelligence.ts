import type {
  CampaignWithInsights,
  InsightsData,
  DailyInsights,
  Alert,
  AIInsight,
  FunnelStep,
  PortfolioAnalysis,
} from '@/types/meta';
import { getActionValue, getRoas } from './analytics';

// ─── Alerts ────────────────────────────────────────────────────────────────────

export function generateAlerts(campaigns: CampaignWithInsights[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  campaigns.forEach((c) => {
    const ins = c.insights;
    if (!ins) return;

    const spend = parseFloat(ins.spend || '0');
    const ctr = parseFloat(ins.ctr || '0');
    const cpc = parseFloat(ins.cpc || '0');
    const cpm = parseFloat(ins.cpm || '0');
    const freq = parseFloat(ins.frequency || '0');
    const roas = getRoas(ins.purchase_roas || ins.website_purchase_roas);
    const conversions =
      getActionValue(ins.actions, 'lead') + getActionValue(ins.actions, 'purchase');

    // Critical: ROAS < 0.5 with real spend
    if (roas !== null && roas < 0.5 && spend > 50) {
      alerts.push({
        id: `roas-critical-${c.id}`,
        campaignId: c.id,
        campaignName: c.name,
        priority: 'critical',
        category: 'performance',
        title: 'ROAS crítico',
        message: `"${c.name}" tiene ROAS ${roas.toFixed(2)}x — perdés dinero en cada venta.`,
        metric: 'ROAS',
        value: `${roas.toFixed(2)}x`,
        threshold: '0.5x',
        action: 'Pausar campaña y revisar oferta/audiencia',
        timestamp: now,
      });
    }

    // Critical: spend > $200 with 0 conversions
    if (spend > 200 && conversions === 0) {
      alerts.push({
        id: `no-conv-critical-${c.id}`,
        campaignId: c.id,
        campaignName: c.name,
        priority: 'critical',
        category: 'pixel',
        title: 'Gasto sin conversiones',
        message: `"${c.name}" gastó $${spend.toFixed(0)} sin registrar ninguna conversión.`,
        metric: 'Conversiones',
        value: '0',
        threshold: '>0 con gasto >$200',
        action: 'Verificar píxel y evento de conversión',
        timestamp: now,
      });
    }

    // Critical: frequency > 5
    if (freq > 5) {
      alerts.push({
        id: `freq-critical-${c.id}`,
        campaignId: c.id,
        campaignName: c.name,
        priority: 'critical',
        category: 'audience',
        title: 'Saturación de audiencia severa',
        message: `"${c.name}" tiene frecuencia ${freq.toFixed(1)} — la audiencia está muy saturada.`,
        metric: 'Frecuencia',
        value: freq.toFixed(1),
        threshold: '5',
        action: 'Ampliar audiencia o pausar campaña',
        timestamp: now,
      });
    }

    // High: CTR < 0.5%
    if (ctr < 0.5 && ctr > 0) {
      alerts.push({
        id: `ctr-high-${c.id}`,
        campaignId: c.id,
        campaignName: c.name,
        priority: 'high',
        category: 'creative',
        title: 'CTR muy bajo',
        message: `"${c.name}" tiene CTR ${ctr.toFixed(2)}% — el creativo no está resonando con la audiencia.`,
        metric: 'CTR',
        value: `${ctr.toFixed(2)}%`,
        threshold: '0.5%',
        action: 'Renovar creatividades y copys',
        timestamp: now,
      });
    }

    // High: CPM muy alto (>$50)
    if (cpm > 50) {
      alerts.push({
        id: `cpm-high-${c.id}`,
        campaignId: c.id,
        campaignName: c.name,
        priority: 'high',
        category: 'audience',
        title: 'CPM elevado',
        message: `"${c.name}" tiene CPM $${cpm.toFixed(0)} — audiencia muy competida o muy pequeña.`,
        metric: 'CPM',
        value: `$${cpm.toFixed(0)}`,
        threshold: '$50',
        action: 'Ampliar audiencia o ajustar segmentación',
        timestamp: now,
      });
    }

    // Medium: frequency > 3
    if (freq > 3 && freq <= 5) {
      alerts.push({
        id: `freq-medium-${c.id}`,
        campaignId: c.id,
        campaignName: c.name,
        priority: 'medium',
        category: 'audience',
        title: 'Frecuencia elevada',
        message: `"${c.name}" tiene frecuencia ${freq.toFixed(1)} — empezá a rotar creatividades.`,
        metric: 'Frecuencia',
        value: freq.toFixed(1),
        threshold: '3',
        action: 'Rotar creatividades',
        timestamp: now,
      });
    }

    // Medium: CPC > $5
    if (cpc > 5) {
      alerts.push({
        id: `cpc-medium-${c.id}`,
        campaignId: c.id,
        campaignName: c.name,
        priority: 'medium',
        category: 'performance',
        title: 'CPC alto',
        message: `"${c.name}" tiene CPC $${cpc.toFixed(2)} — costo por clic elevado.`,
        metric: 'CPC',
        value: `$${cpc.toFixed(2)}`,
        threshold: '$5',
        action: 'Revisar puja y relevancia del anuncio',
        timestamp: now,
      });
    }
  });

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ─── Portfolio Insights ────────────────────────────────────────────────────────

function generatePortfolioInsights(
  campaigns: CampaignWithInsights[],
  metrics: {
    totalSpend: number;
    avgCTR: number;
    avgCPC: number;
    avgROAS: number | null;
    avgFreq: number;
    totalConversions: number;
  }
): AIInsight[] {
  const insights: AIInsight[] = [];
  const { totalSpend, avgCTR, avgCPC, avgROAS, avgFreq, totalConversions } = metrics;

  // Positive: good CTR
  if (avgCTR >= 1.5) {
    insights.push({
      id: 'ctr-positive',
      type: 'positive',
      title: 'CTR por encima del benchmark',
      detail: `Tu CTR promedio es ${avgCTR.toFixed(2)}% — el benchmark de la industria es 0.9%. Tus creatividades están funcionando bien.`,
      impact: 'high',
      emoji: '📈',
      action: 'Escalá las campañas con mejor CTR',
      metric: 'CTR',
      value: `${avgCTR.toFixed(2)}%`,
    });
  }

  // Negative: poor CTR
  if (avgCTR < 0.9 && avgCTR > 0) {
    insights.push({
      id: 'ctr-negative',
      type: 'negative',
      title: 'CTR por debajo del benchmark',
      detail: `Tu CTR promedio es ${avgCTR.toFixed(2)}% — por debajo del 0.9% de referencia. Revisá creatividades y audiencias.`,
      impact: 'high',
      emoji: '⚠️',
      action: 'Renovar creatividades',
      metric: 'CTR',
      value: `${avgCTR.toFixed(2)}%`,
    });
  }

  // Positive: good ROAS
  if (avgROAS !== null && avgROAS >= 3) {
    insights.push({
      id: 'roas-positive',
      type: 'positive',
      title: 'ROAS excelente',
      detail: `Tu ROAS promedio es ${avgROAS.toFixed(1)}x — cada $1 invertido genera $${avgROAS.toFixed(2)} en ventas. Considerá escalar.`,
      impact: 'high',
      emoji: '🚀',
      action: 'Aumentar presupuesto 20-30%',
      metric: 'ROAS',
      value: `${avgROAS.toFixed(1)}x`,
    });
  }

  // Negative: poor ROAS
  if (avgROAS !== null && avgROAS < 1) {
    insights.push({
      id: 'roas-negative',
      type: 'negative',
      title: 'ROAS por debajo de 1x',
      detail: `ROAS ${avgROAS.toFixed(2)}x — estás perdiendo dinero. Por cada $1 invertido sólo recuperás $${avgROAS.toFixed(2)}.`,
      impact: 'high',
      emoji: '🔴',
      action: 'Pausar campañas no rentables urgente',
      metric: 'ROAS',
      value: `${avgROAS.toFixed(2)}x`,
    });
  }

  // Warning: high frequency
  if (avgFreq > 3) {
    insights.push({
      id: 'freq-warning',
      type: 'warning',
      title: 'Frecuencia alta en el portfolio',
      detail: `La frecuencia promedio es ${avgFreq.toFixed(1)} — la audiencia empieza a saturarse. Rotá creatividades.`,
      impact: 'medium',
      emoji: '🔄',
      action: 'Rotar creatividades y ampliar audiencias',
      metric: 'Frecuencia',
      value: avgFreq.toFixed(1),
    });
  }

  // Opportunity: no conversions with spend
  if (totalConversions === 0 && totalSpend > 100) {
    insights.push({
      id: 'pixel-opportunity',
      type: 'warning',
      title: 'Sin conversiones registradas',
      detail: `Gastaste $${totalSpend.toFixed(0)} sin registrar conversiones. Verificá la configuración del píxel de Meta.`,
      impact: 'high',
      emoji: '🔧',
      action: 'Verificar píxel con Meta Pixel Helper',
    });
  }

  // Opportunity: good CPC
  if (avgCPC > 0 && avgCPC < 1.5) {
    insights.push({
      id: 'cpc-opportunity',
      type: 'opportunity',
      title: 'CPC eficiente',
      detail: `Tu CPC promedio de $${avgCPC.toFixed(2)} está en zona eficiente. Aprovechá para aumentar volumen.`,
      impact: 'medium',
      emoji: '💡',
      action: 'Aumentar presupuesto de campañas activas',
      metric: 'CPC',
      value: `$${avgCPC.toFixed(2)}`,
    });
  }

  // Find best performing campaign
  const withROAS = campaigns.filter(
    (c) => c.insights && getRoas(c.insights.purchase_roas) !== null
  );
  if (withROAS.length > 0) {
    const best = withROAS.sort((a, b) => {
      const rA = getRoas(a.insights!.purchase_roas) || 0;
      const rB = getRoas(b.insights!.purchase_roas) || 0;
      return rB - rA;
    })[0];
    const bestRoas = getRoas(best.insights!.purchase_roas);
    if (bestRoas && bestRoas >= 2) {
      insights.push({
        id: 'top-campaign',
        type: 'opportunity',
        title: 'Campaña estrella identificada',
        detail: `"${best.name}" es tu mejor campaña con ROAS ${bestRoas.toFixed(1)}x. Escalá gradualmente su presupuesto.`,
        impact: 'high',
        emoji: '⭐',
        action: `Escalar presupuesto de "${best.name}"`,
        metric: 'ROAS',
        value: `${bestRoas.toFixed(1)}x`,
      });
    }
  }

  // Prediction based on trend
  if (totalSpend > 500) {
    insights.push({
      id: 'budget-prediction',
      type: 'prediction',
      title: 'Proyección de gasto',
      detail: `Al ritmo actual gastarás ~$${(totalSpend * 1.1).toFixed(0)} el próximo mes. Asegurate de tener presupuesto disponible.`,
      impact: 'medium',
      emoji: '🔮',
      metric: 'Gasto proyectado',
      value: `$${(totalSpend * 1.1).toFixed(0)}`,
    });
  }

  return insights;
}

// ─── Portfolio Analysis ────────────────────────────────────────────────────────

export function generatePortfolioAnalysis(campaigns: CampaignWithInsights[]): PortfolioAnalysis {
  const withData = campaigns.filter((c) => c.insights);

  let totalSpend = 0,
    totalImpressions = 0,
    totalClicks = 0,
    totalConversions = 0;
  let totalCTR = 0,
    totalCPC = 0,
    totalCPM = 0,
    totalFreq = 0;
  const totalROAS: number[] = [];

  withData.forEach((c) => {
    const ins = c.insights!;
    totalSpend += parseFloat(ins.spend || '0');
    totalImpressions += parseInt(ins.impressions || '0');
    totalClicks += parseInt(ins.clicks || '0');
    totalCTR += parseFloat(ins.ctr || '0');
    totalCPC += parseFloat(ins.cpc || '0');
    totalCPM += parseFloat(ins.cpm || '0');
    totalFreq += parseFloat(ins.frequency || '0');
    const conversions =
      getActionValue(ins.actions, 'lead') + getActionValue(ins.actions, 'purchase');
    totalConversions += conversions;
    const roas = getRoas(ins.purchase_roas || ins.website_purchase_roas);
    if (roas !== null) totalROAS.push(roas);
  });

  const n = withData.length || 1;
  const avgROAS = totalROAS.length ? totalROAS.reduce((a, b) => a + b, 0) / totalROAS.length : null;
  const avgCTR = totalCTR / n;
  const avgCPC = totalCPC / n;
  const avgFreq = totalFreq / n;

  // Health score
  let score = 50;
  if (avgCTR >= 2) score += 15;
  else if (avgCTR >= 1) score += 8;
  else score -= 10;

  if (avgCPC < 1) score += 10;
  else if (avgCPC > 5) score -= 15;

  if (avgFreq < 2) score += 10;
  else if (avgFreq > 3) score -= 10;

  if (avgROAS !== null) {
    if (avgROAS >= 3) score += 15;
    else if (avgROAS >= 1) score += 5;
    else score -= 20;
  }

  if (totalConversions === 0 && totalSpend > 200) score -= 20;

  score = Math.max(0, Math.min(100, score));

  const alerts = generateAlerts(campaigns);
  const insights = generatePortfolioInsights(campaigns, {
    totalSpend,
    avgCTR,
    avgCPC,
    avgROAS,
    avgFreq,
    totalConversions,
  });

  // Top / worst campaigns
  const sorted = [...withData].sort((a, b) => {
    const rA = getRoas(a.insights?.purchase_roas) ?? parseFloat(a.insights?.ctr || '0');
    const rB = getRoas(b.insights?.purchase_roas) ?? parseFloat(b.insights?.ctr || '0');
    return rB - rA;
  });

  const topCampaign = sorted[0]?.name || campaigns[0]?.name || 'N/A';
  const worstCampaign = sorted[sorted.length - 1]?.name || campaigns[0]?.name || 'N/A';

  const healthLabel =
    score >= 80
      ? 'Excelente'
      : score >= 60
      ? 'Saludable'
      : score >= 40
      ? 'Regular'
      : score >= 20
      ? 'En riesgo'
      : 'Crítico';

  const riskLevel: PortfolioAnalysis['riskLevel'] =
    score >= 60 ? 'low' : score >= 40 ? 'medium' : score >= 20 ? 'high' : 'critical';

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    avgCTR,
    avgCPC,
    avgCPM: totalCPM / n,
    avgROAS,
    avgFrequency: avgFreq,
    healthScore: score,
    healthLabel,
    alerts,
    insights,
    topCampaign,
    worstCampaign,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'ACTIVE').length,
    riskLevel,
  };
}

// ─── Campaign Insights ─────────────────────────────────────────────────────────

export function generateCampaignInsights(
  campaign: CampaignWithInsights,
  insights: InsightsData,
  daily?: DailyInsights[]
): AIInsight[] {
  const result: AIInsight[] = [];
  const spend = parseFloat(insights.spend || '0');
  const ctr = parseFloat(insights.ctr || '0');
  const cpc = parseFloat(insights.cpc || '0');
  const freq = parseFloat(insights.frequency || '0');
  const roas = getRoas(insights.purchase_roas || insights.website_purchase_roas);
  const purchases = getActionValue(insights.actions, 'purchase');
  const leads = getActionValue(insights.actions, 'lead');
  const addToCart = getActionValue(insights.actions, 'add_to_cart');
  const initiateCheckout = getActionValue(insights.actions, 'initiate_checkout');
  const landingPageViews = getActionValue(insights.actions, 'landing_page_view');
  const clicks = parseInt(insights.clicks || '0');

  // CTR high but no conversions
  if (ctr >= 1.5 && purchases === 0 && leads === 0) {
    result.push({
      id: 'ctr-no-conv',
      type: 'warning',
      title: 'CTR alto pero sin conversiones',
      detail: `CTR de ${ctr.toFixed(2)}% — el tráfico llega pero no convierte. El problema está en la landing page o el proceso de compra.`,
      impact: 'high',
      emoji: '🔍',
      action: 'Auditar landing page y checkout',
    });
  }

  // Frequency warning
  if (freq >= 4) {
    result.push({
      id: 'freq-saturation',
      type: 'warning',
      title: `Frecuencia ${freq.toFixed(1)} → audiencia saturándose`,
      detail: `La misma persona ve tu anuncio ${freq.toFixed(1)} veces. Esto aumenta el CPC y reduce el CTR. Rotá creatividades urgente.`,
      impact: 'high',
      emoji: '🔄',
      action: 'Rotar creatividades y ampliar audiencia',
    });
  }

  // ROAS scaling opportunity
  if (roas !== null && roas >= 3) {
    result.push({
      id: 'roas-scale',
      type: 'opportunity',
      title: `ROAS ${roas.toFixed(1)}x → candidata para escalar`,
      detail: `Con ROAS ${roas.toFixed(1)}x esta campaña es rentable. Aumentá el presupuesto 20% por día y monitoreá los primeros días.`,
      impact: 'high',
      emoji: '🚀',
      action: 'Aumentar presupuesto 20% y monitorear',
      metric: 'ROAS',
      value: `${roas.toFixed(1)}x`,
    });
  }

  // Add to cart but no checkout
  if (addToCart > 0 && initiateCheckout === 0) {
    result.push({
      id: 'cart-no-checkout',
      type: 'negative',
      title: 'Agregan al carrito pero no hacen checkout',
      detail: `${addToCart} personas agregaron al carrito pero 0 iniciaron el checkout. Revisá si el botón de checkout funciona correctamente.`,
      impact: 'high',
      emoji: '🛒',
      action: 'Revisar flujo de checkout',
    });
  }

  // Checkout but no purchase
  if (initiateCheckout > 0 && purchases === 0) {
    result.push({
      id: 'checkout-no-purchase',
      type: 'negative',
      title: 'Inician checkout pero no compran',
      detail: `${initiateCheckout} personas iniciaron el checkout pero 0 compraron. Posible problema con medios de pago o fricción en el proceso.`,
      impact: 'high',
      emoji: '💳',
      action: 'Revisar medios de pago y proceso de compra',
    });
  }

  // Landing page bounce
  if (clicks > 0 && landingPageViews > 0) {
    const landingRate = (landingPageViews / clicks) * 100;
    if (landingRate < 60) {
      result.push({
        id: 'landing-bounce',
        type: 'negative',
        title: 'Alta tasa de rebote en landing',
        detail: `Solo ${landingRate.toFixed(0)}% de los clics llegan a ver la landing page. Revisá la velocidad de carga (debe ser <3 segundos).`,
        impact: 'high',
        emoji: '⚡',
        action: 'Optimizar velocidad de landing page',
      });
    }
  }

  // Best day analysis from daily data
  if (daily && daily.length > 0) {
    const bestDay = daily.reduce((best, d) =>
      parseFloat(d.ctr || '0') > parseFloat(best.ctr || '0') ? d : best
    );
    const dayName = new Date(bestDay.date_start).toLocaleDateString('es-AR', { weekday: 'long' });
    result.push({
      id: 'best-day',
      type: 'positive',
      title: `Mejor día: ${dayName}`,
      detail: `Tu campaña rinde mejor los ${dayName} con CTR de ${parseFloat(bestDay.ctr || '0').toFixed(2)}%. Considerá aumentar el presupuesto ese día.`,
      impact: 'medium',
      emoji: '📅',
      action: `Configurar dayparting para ${dayName}`,
    });
  }

  // Low spend campaign
  if (spend < 50 && campaign.status === 'ACTIVE') {
    result.push({
      id: 'low-spend',
      type: 'warning',
      title: 'Gasto muy bajo para optimización',
      detail: `Con $${spend.toFixed(0)} de gasto, el algoritmo no tiene suficientes datos para optimizar. Necesitás al menos $50/día.`,
      impact: 'medium',
      emoji: '💰',
      action: 'Aumentar presupuesto diario a $50 mínimo',
    });
  }

  return result;
}

// ─── Funnel ────────────────────────────────────────────────────────────────────

export function buildFunnel(insights: InsightsData): FunnelStep[] {
  const impressions = parseInt(insights.impressions || '0');
  const clicks = parseInt(insights.clicks || '0');
  const landingPageViews = getActionValue(insights.actions, 'landing_page_view');
  const addToCart = getActionValue(insights.actions, 'add_to_cart');
  const initiateCheckout = getActionValue(insights.actions, 'initiate_checkout');
  const purchase = getActionValue(insights.actions, 'purchase');

  const steps: Array<{ label: string; value: number; color: string; icon: string }> = [
    { label: 'Impresiones', value: impressions, color: '#7c3aed', icon: '👁️' },
    { label: 'Clics', value: clicks, color: '#3b82f6', icon: '🖱️' },
    { label: 'Vista de landing', value: landingPageViews, color: '#06b6d4', icon: '📄' },
    { label: 'Agregó al carrito', value: addToCart, color: '#f59e0b', icon: '🛒' },
    { label: 'Inició checkout', value: initiateCheckout, color: '#f97316', icon: '💳' },
    { label: 'Compra', value: purchase, color: '#10b981', icon: '✅' },
  ].filter((s) => s.value > 0);

  if (steps.length === 0) return [];

  const topValue = steps[0].value;

  return steps.map((step, i) => {
    const prevValue = i === 0 ? step.value : steps[i - 1].value;
    const dropoff = prevValue > 0 ? ((prevValue - step.value) / prevValue) * 100 : 0;
    return {
      label: step.label,
      value: step.value,
      percentage: topValue > 0 ? (step.value / topValue) * 100 : 0,
      dropoff: i === 0 ? 0 : dropoff,
      color: step.color,
      icon: step.icon,
    };
  });
}

// ─── Predictions ───────────────────────────────────────────────────────────────

export function generatePredictions(daily: DailyInsights[]): {
  projectedSpend: number;
  projectedConversions: number;
  projectedROAS: number | null;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
} {
  if (!daily || daily.length < 3) {
    return {
      projectedSpend: 0,
      projectedConversions: 0,
      projectedROAS: null,
      trend: 'stable',
      confidence: 0,
    };
  }

  const last7 = daily.slice(-7);
  const spends = last7.map((d) => parseFloat(d.spend || '0'));
  const avgSpend = spends.reduce((a, b) => a + b, 0) / spends.length;

  // Simple linear regression for spend trend
  const n = spends.length;
  const xMean = (n - 1) / 2;
  const yMean = avgSpend;
  const slope =
    spends.reduce((sum, y, x) => sum + (x - xMean) * (y - yMean), 0) /
    spends.reduce((sum, _, x) => sum + Math.pow(x - xMean, 2), 0);

  const projectedDailySpend = Math.max(0, avgSpend + slope * 7);
  const projectedSpend = projectedDailySpend * 7;

  // Trend detection
  const firstHalf = spends.slice(0, Math.floor(n / 2));
  const secondHalf = spends.slice(Math.floor(n / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trendPct = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

  const trend: 'improving' | 'stable' | 'declining' =
    trendPct > 5 ? 'improving' : trendPct < -5 ? 'declining' : 'stable';

  // Projected conversions (rough estimate based on average CTR and spend)
  const avgCTR = last7.reduce((a, b) => a + parseFloat(b.ctr || '0'), 0) / last7.length;
  const avgCPC = last7.reduce((a, b) => a + parseFloat(b.cpc || '0'), 0) / last7.length;
  const projectedClicks = avgCPC > 0 ? projectedSpend / avgCPC : 0;
  const convRate = 0.02; // 2% estimated conversion rate
  const projectedConversions = Math.round(projectedClicks * convRate * (avgCTR / 1.5));

  const confidence = Math.min(95, 40 + n * 5);

  return {
    projectedSpend,
    projectedConversions,
    projectedROAS: null,
    trend,
    confidence,
  };
}

// ─── Smart Recommendations ─────────────────────────────────────────────────────

export function getSmartRecommendations(campaigns: CampaignWithInsights[]): string[] {
  const recs: string[] = [];
  const withData = campaigns.filter((c) => c.insights);

  if (withData.length === 0) {
    return [
      'Configurá tu token de acceso en Configuración para ver datos reales.',
      'Conectá tu cuenta de anuncios de Meta para empezar el análisis.',
    ];
  }

  const totalSpend = withData.reduce((s, c) => s + parseFloat(c.insights!.spend || '0'), 0);
  const avgFreq =
    withData.reduce((s, c) => s + parseFloat(c.insights!.frequency || '0'), 0) / withData.length;
  const avgCTR =
    withData.reduce((s, c) => s + parseFloat(c.insights!.ctr || '0'), 0) / withData.length;
  const totalConversions = withData.reduce(
    (s, c) =>
      s +
      getActionValue(c.insights!.actions, 'purchase') +
      getActionValue(c.insights!.actions, 'lead'),
    0
  );

  const highROAS = withData
    .filter((c) => {
      const r = getRoas(c.insights?.purchase_roas);
      return r !== null && r >= 3;
    })
    .sort((a, b) => {
      const rA = getRoas(a.insights!.purchase_roas) || 0;
      const rB = getRoas(b.insights!.purchase_roas) || 0;
      return rB - rA;
    });

  const lowCTR = withData.filter((c) => parseFloat(c.insights!.ctr || '0') < 0.9);
  const highFreq = withData.filter((c) => parseFloat(c.insights!.frequency || '0') > 3);

  if (highROAS.length > 0) {
    recs.push(
      `Escalá "${highROAS[0].name}" (ROAS ${getRoas(highROAS[0].insights!.purchase_roas)?.toFixed(1)}x): aumentá el presupuesto 20% por día durante 3-5 días.`
    );
  }

  if (lowCTR.length > 0) {
    recs.push(
      `Renovar creatividades en ${lowCTR.length} campaña(s) con CTR bajo: probá nuevos formatos (video, carrusel) y copys con propuesta de valor clara.`
    );
  }

  if (highFreq.length > 0) {
    recs.push(
      `Rotá creatividades en "${highFreq[0].name}" (frecuencia ${parseFloat(highFreq[0].insights!.frequency || '0').toFixed(1)}x) para evitar "ad fatigue".`
    );
  }

  if (totalConversions === 0 && totalSpend > 100) {
    recs.push(
      'Verificá el píxel de Meta con la extensión "Meta Pixel Helper" — el evento de conversión no está disparando correctamente.'
    );
  }

  if (avgCTR < 1) {
    recs.push(
      `Probá nuevos ángulos creativos: testimonios de clientes, antes/después, o video demo del producto. El CTR promedio actual (${avgCTR.toFixed(2)}%) tiene margen de mejora.`
    );
  }

  if (avgFreq > 2.5) {
    recs.push(
      `Ampliá tus audiencias actuales (promedio frecuencia ${avgFreq.toFixed(1)}x). Probá Lookalike audiences del 2-5% basadas en tus mejores compradores.`
    );
  }

  recs.push(
    'Instalá el Conversions API (CAPI) para mejorar el tracking de conversiones y reducir el impacto de los bloqueadores de cookies.'
  );

  recs.push(
    'Configurá un embudo de retargeting: visitantes del sitio → carrito abandonado → compradores. Cada etapa con mensajes específicos.'
  );

  return recs.slice(0, 8);
}

// ─── Chat Response ─────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function generateChatResponse(
  question: string,
  analysis: PortfolioAnalysis,
  campaigns: CampaignWithInsights[]
): string {
  const q = normalize(question);
  const noData = campaigns.filter((c) => c.insights).length === 0;

  if (noData) {
    return `Todavía no tengo datos de tus campañas. Conectá tu cuenta en Configuración con un Access Token válido y volvé a preguntar — voy a analizar tus métricas reales.`;
  }

  // ── Escalar ────────────────────────────────────────────────────────────────
  if (q.includes('escalar') || q.includes('scale') || q.includes('aumentar presupuesto') || q.includes('subir presupuesto')) {
    const best = campaigns
      .filter((c) => c.insights)
      .sort((a, b) => {
        const rA = getRoas(a.insights!.purchase_roas) || parseFloat(a.insights!.ctr || '0') / 10;
        const rB = getRoas(b.insights!.purchase_roas) || parseFloat(b.insights!.ctr || '0') / 10;
        return rB - rA;
      })[0];
    if (best) {
      const roas = getRoas(best.insights!.purchase_roas);
      const ctr = parseFloat(best.insights!.ctr || '0');
      if (roas && roas >= 2) {
        return `La campaña para escalar es "${best.name}" con ROAS ${roas.toFixed(1)}x. Aumentá el presupuesto un 20% por día (no más) durante 3-5 días y revisá cada 48h. Si el ROAS se mantiene por encima de 2x, seguís subiendo. Si baja más del 15%, pausá el escalado y dejá que el algoritmo se re-optimice.`;
      }
      if (ctr >= 1.5) {
        return `"${best.name}" tiene el mejor CTR (${ctr.toFixed(2)}%) pero sin ROAS comprobado todavía. Antes de escalar, asegurate de que el píxel mida conversiones. Con CTR bueno y píxel funcionando, en 7 días tendrás datos suficientes para escalar con confianza.`;
      }
    }
    return `Ninguna campaña tiene ROAS > 2x todavía (salud del portfolio: ${analysis.healthScore}/100). Enfocate primero en validar conversiones con la campaña "${analysis.topCampaign}". Una vez que tenga ROAS consistente > 2x durante 7 días, estará lista para escalar.`;
  }

  // ── Ventas / sin conversiones ──────────────────────────────────────────────
  if (
    q.includes('venta') ||
    q.includes('conversion') ||
    q.includes('compra') ||
    q.includes('purchase') ||
    q.includes('no tengo venta') ||
    q.includes('sin venta')
  ) {
    if (analysis.totalConversions === 0 && analysis.totalSpend > 0) {
      const highCTR = campaigns.find(
        (c) => c.insights && parseFloat(c.insights.ctr || '0') > 1
      );
      if (highCTR) {
        return `Tenés clics (CTR de "${highCTR.name}" es ${parseFloat(highCTR.insights!.ctr || '0').toFixed(2)}%) pero 0 conversiones. El problema está después del clic: 1) Verificá el píxel con "Meta Pixel Helper" en Chrome. 2) Testea el proceso de compra vos mismo en mobile. 3) Revisá que el evento Purchase esté disparando. 4) Controlá la velocidad de la landing (debe cargar en <3s).`;
      }
      return `0 conversiones con $${analysis.totalSpend.toFixed(0)} gastados. Causas más probables: 1) Píxel de Meta no configurado o disparando el evento equivocado. 2) Landing page con problemas en mobile (85% del tráfico de Meta es mobile). 3) Proceso de pago con fricción. 4) Oferta no suficientemente atractiva. Empezá verificando el píxel.`;
    }
    if (analysis.totalConversions > 0) {
      const cpa = analysis.totalSpend / analysis.totalConversions;
      const trend = analysis.avgROAS !== null && analysis.avgROAS >= 2 ? 'rentable' : 'mejorable';
      return `Tenés ${analysis.totalConversions} conversiones con CPA de $${cpa.toFixed(0)} — situación ${trend}. Para aumentar volumen: activá retargeting de carrito abandonado (suele tener 3-5x mejor conversión), creá una campaña de Lookalike audience basada en compradores existentes, y optimizá la landing para reducir fricción.`;
    }
    return `No hay datos de conversiones disponibles. Configurá el evento de conversión (Purchase o Lead) en el Administrador de eventos de Meta para que el píxel lo registre correctamente.`;
  }

  // ── Problema / mal / peor ──────────────────────────────────────────────────
  if (
    q.includes('problema') ||
    q.includes('issue') ||
    q.includes('mal') ||
    q.includes('peor') ||
    q.includes('mayor problema') ||
    q.includes('que falla') ||
    q.includes('que fallo')
  ) {
    const criticals = analysis.alerts.filter((a) => a.priority === 'critical');
    const highs = analysis.alerts.filter((a) => a.priority === 'high');
    if (criticals.length > 0) {
      const top = criticals[0];
      return `Tu problema más urgente: ${top.title} — ${top.message} → ${top.action}. También tenés ${highs.length} alerta(s) de prioridad alta. Con un score de salud ${analysis.healthScore}/100, necesitás resolver esto antes de cualquier otra optimización.`;
    }
    if (highs.length > 0) {
      const top = highs[0];
      return `No hay alertas críticas, pero sí tenés ${highs.length} problema(s) de alta prioridad. El principal: ${top.title} — ${top.message} Acción: ${top.action}.`;
    }
    return `No hay problemas críticos en este momento (score ${analysis.healthScore}/100 — ${analysis.healthLabel}). La principal área de mejora es: ${analysis.avgCTR < 1 ? `CTR bajo (${analysis.avgCTR.toFixed(2)}% — benchmark 1%)` : analysis.avgFrequency > 3 ? `frecuencia alta (${analysis.avgFrequency.toFixed(1)}x — máximo recomendado 3x)` : analysis.avgROAS !== null && analysis.avgROAS < 2 ? `ROAS (${analysis.avgROAS.toFixed(1)}x — objetivo 2x+)` : 'el portfolio está bien, mantené el ritmo actual'}.`;
  }

  // ── Qué métrica mejorar primero ────────────────────────────────────────────
  if (
    q.includes('metrica') ||
    q.includes('mejorar primero') ||
    q.includes('que mejorar') ||
    q.includes('por donde empezar') ||
    q.includes('prioridad') ||
    q.includes('primero') ||
    q.includes('foco') ||
    q.includes('enfoque')
  ) {
    // Priority logic: determine the most impactful metric to fix
    const criticalAlerts = analysis.alerts.filter((a) => a.priority === 'critical');
    const noConversions = analysis.totalConversions === 0 && analysis.totalSpend > 100;
    const poorROAS = analysis.avgROAS !== null && analysis.avgROAS < 1;
    const poorCTR = analysis.avgCTR < 0.5 && analysis.avgCTR > 0;
    const highFreq = analysis.avgFrequency > 4;

    if (noConversions) {
      return `Prioridad #1: el píxel de conversión. Gastás dinero pero no registrás resultados — eso significa que o el píxel no está instalado, o el evento (Purchase/Lead) no está configurado. Sin esto, todo lo demás es ciego. Instalá "Meta Pixel Helper" y verificá que dispare al completar una compra.`;
    }
    if (poorROAS) {
      return `Prioridad #1: ROAS (actualmente ${analysis.avgROAS!.toFixed(2)}x — estás perdiendo dinero). Antes de optimizar CTR o frecuencia, solucioná la rentabilidad. Pausá campañas con ROAS < 1, revisá la propuesta de valor y el precio, y testea nuevas audiencias más calificadas.`;
    }
    if (criticalAlerts.length > 0) {
      const top = criticalAlerts[0];
      return `Prioridad #1: resolver "${top.title}" — es lo que más frena tu portfolio ahora mismo. ${top.action}. Una vez resuelto, las otras métricas deberían mejorar en cascada.`;
    }
    if (poorCTR) {
      return `Prioridad #1: CTR (${analysis.avgCTR.toFixed(2)}% — muy por debajo del 0.9% de benchmark). El CTR bajo encarece todo: aumenta el CPC, el CPM y reduce la eficiencia del gasto. Cambiá los creativos primero — es el cambio con mayor impacto inmediato.`;
    }
    if (highFreq) {
      return `Prioridad #1: frecuencia (${analysis.avgFrequency.toFixed(1)}x — la audiencia está saturada). Cuando la frecuencia supera 3-4x, el CTR cae y el CPC sube. Rotá creatividades urgente o ampliá las audiencias antes de que el rendimiento se deteriore más.`;
    }
    if (analysis.avgCTR < 1) {
      return `Tu métrica más impactante a mejorar es el CTR (${analysis.avgCTR.toFixed(2)}%). Con mejor CTR obtenés más clics al mismo costo, el CPM efectivo baja y el algoritmo te premia con más distribución. Testá 3-4 creatividades nuevas esta semana con diferentes hooks (primeros 3 segundos distintos).`;
    }
    return `Tu portfolio está en zona saludable (${analysis.healthScore}/100). La métrica a optimizar ahora es ${analysis.avgROAS !== null ? `mejorar el ROAS de ${analysis.avgROAS.toFixed(1)}x a 3x+` : `escalar el volumen manteniendo el CTR de ${analysis.avgCTR.toFixed(2)}%`}. Hacelo aumentando el presupuesto de la campaña "${analysis.topCampaign}" gradualmente.`;
  }

  // ── CTR ───────────────────────────────────────────────────────────────────
  if (q.includes('ctr') || q.includes('clic') || q.includes('click') || q.includes('tasa de clics')) {
    const ctrStatus = analysis.avgCTR >= 2 ? 'excelente' : analysis.avgCTR >= 1 ? 'bueno' : analysis.avgCTR >= 0.5 ? 'bajo' : 'muy bajo';
    const actionText = analysis.avgCTR < 1
      ? 'Para mejorar el CTR: 1) Probá video vs imagen estática (video sube 2-3x el CTR). 2) Usá caras humanas reales en las imágenes. 3) El hook en los primeros 3 segundos es todo. 4) CTA claro y específico ("Comprá ahora" > "Más información"). 5) Probá distintos formatos — Story, Reel, Feed.'
      : `Estás bien posicionado. Rotá creatividades cada 2-3 semanas para mantenerlo.`;
    return `CTR promedio: ${analysis.avgCTR.toFixed(2)}% — ${ctrStatus}. Benchmark de Meta Ads: 0.9-1.5%. ${actionText}`;
  }

  // ── CPC ───────────────────────────────────────────────────────────────────
  if (q.includes('cpc') || q.includes('costo por clic') || q.includes('precio clic')) {
    if (analysis.avgCPC === 0) return `No hay datos de CPC disponibles todavía. Necesitás tener campañas activas con clics registrados.`;
    const cpcStatus = analysis.avgCPC < 1 ? '¡Muy eficiente! Aprovechá para aumentar el volumen.' : analysis.avgCPC < 3 ? 'En rango aceptable.' : analysis.avgCPC < 6 ? 'Algo elevado — hay margen de mejora.' : 'Alto. Hay que optimizarlo urgente.';
    return `CPC promedio: $${analysis.avgCPC.toFixed(2)} — ${cpcStatus} El CPC depende principalmente del CTR: un CTR más alto = CPC más bajo (el algoritmo premia los anuncios relevantes). También influyen el tamaño de audiencia y la competencia en la subasta. ${analysis.avgCPC > 3 ? 'Para reducirlo: mejorá el CTR, ampliá las audiencias y probá la puja "Costo más bajo".' : ''}`;
  }

  // ── ROAS / retorno / ROI ───────────────────────────────────────────────────
  if (q.includes('roas') || q.includes('retorno') || q.includes('roi') || q.includes('rentabilidad') || q.includes('ganancia')) {
    if (analysis.avgROAS === null) {
      return `No hay datos de ROAS todavía. Esto pasa porque: 1) Las campañas tienen objetivo de tráfico/alcance (no conversiones). 2) El evento Purchase no está configurado en el píxel. 3) No hubo compras en el período. Para ver ROAS real, configurá el evento de conversión en el píxel de Meta.`;
    }
    const roasLabel = analysis.avgROAS >= 4 ? 'excelente' : analysis.avgROAS >= 2 ? 'rentable' : analysis.avgROAS >= 1 ? 'en equilibrio' : 'negativo';
    return `ROAS promedio: ${analysis.avgROAS.toFixed(1)}x — ${roasLabel}. ${analysis.avgROAS >= 3 ? `"${analysis.topCampaign}" es tu mejor campaña — escalá su presupuesto 20% por día.` : analysis.avgROAS >= 1 ? 'Para mejorar el ROAS: optimizá la landing page (velocidad + CTA), agrega prueba social (testimonios, reseñas) y probá retargeting de carrito abandonado.' : 'Pausá las campañas con ROAS < 1 inmediatamente. Revisá la propuesta de valor, el precio y la audiencia antes de reinvertir.'}`;
  }

  // ── Frecuencia / saturación ────────────────────────────────────────────────
  if (q.includes('frecuencia') || q.includes('saturacion') || q.includes('ad fatigue') || q.includes('fatiga')) {
    const highFreqCamps = campaigns.filter(
      (c) => c.insights && parseFloat(c.insights.frequency || '0') > 3
    );
    if (highFreqCamps.length > 0) {
      const worst = highFreqCamps.sort(
        (a, b) => parseFloat(b.insights!.frequency || '0') - parseFloat(a.insights!.frequency || '0')
      )[0];
      return `Frecuencia promedio: ${analysis.avgFrequency.toFixed(1)}x. "${worst.name}" tiene ${parseFloat(worst.insights!.frequency || '0').toFixed(1)}x — audiencia saturada. Esto aumenta el CPM y baja el CTR. Soluciones: 1) Creá 3-5 variaciones del anuncio (mismo mensaje, distinto formato). 2) Ampliá la audiencia objetivo. 3) Activá Advantage+ Audience de Meta. 4) Si supera 5x, pausá y descansá la audiencia 2 semanas.`;
    }
    return `Frecuencia promedio: ${analysis.avgFrequency.toFixed(1)}x — dentro del rango saludable (< 3x). Para mantenerla bajo control: rotá creatividades cada 2-3 semanas y usá exclusiones de audiencias para no impactar siempre a las mismas personas.`;
  }

  // ── Pixel / tracking ──────────────────────────────────────────────────────
  if (q.includes('pixel') || q.includes('tracking') || q.includes('evento') || q.includes('capi')) {
    return `Para un tracking perfecto en 2025: 1) Instala el píxel de Meta en el <head> de todas las páginas. 2) Configurá los eventos estándar: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase. 3) Implementá la Conversions API (CAPI) para capturar eventos server-side (resuelve el 30-40% de conversiones perdidas por bloqueadores). 4) Usá "Meta Pixel Helper" en Chrome para verificar que todo dispara. 5) Activá el matching avanzado (email, teléfono) para mejorar la atribución.`;
  }

  // ── Audiencia / público / targeting ───────────────────────────────────────
  if (
    q.includes('audiencia') ||
    q.includes('publico') ||
    q.includes('targeting') ||
    q.includes('segmentacion') ||
    q.includes('lookalike') ||
    q.includes('intereses')
  ) {
    const highFreqCamps = campaigns.filter(
      (c) => c.insights && parseFloat(c.insights.frequency || '0') > 3
    );
    if (highFreqCamps.length > 0) {
      return `${highFreqCamps.length} campaña(s) con frecuencia alta — audiencias saturadas. Para expandirlas: 1) Creá Lookalike Audiences 2-3% basadas en compradores existentes. 2) Probá Advantage+ Audience para que el algoritmo encuentre nuevos compradores. 3) Ampliá el rango de edad/geografía. 4) Excluí a los que ya compraron para no desperdiciar impresiones.`;
    }
    return `Audiencias en estado saludable (frecuencia ${analysis.avgFrequency.toFixed(1)}x). Estrategia recomendada: tráfico frío con Lookalike 1-3% (mayor precisión) + retargeting con Lookalike 3-5% (mayor volumen) + retargeting de visitantes del sitio (mayor intención). Mantené siempre una campaña de retargeting activa — suele tener 3-5x mejor ROAS.`;
  }

  // ── Creatividades / anuncio / imagen / video ───────────────────────────────
  if (
    q.includes('creativo') ||
    q.includes('creative') ||
    q.includes('anuncio') ||
    q.includes('imagen') ||
    q.includes('video') ||
    q.includes('copy') ||
    q.includes('texto')
  ) {
    return `Creatividades de alto rendimiento en Meta Ads: 1) Video short-form (9:16) supera a imagen en CTR 2-3x. 2) Los primeros 3 segundos determinan si continúan o no — usá un "hook" disruptivo. 3) Mostrá caras humanas reales (generan más conexión que productos solos). 4) Subtítulos en video (85% ve sin sonido). 5) CTA claro con urgencia o beneficio específico. 6) Rotá mínimo 3 variantes por campaña. Tu CTR actual (${analysis.avgCTR.toFixed(2)}%) ${analysis.avgCTR < 1.5 ? 'tiene margen de mejora con nuevos creativos' : 'indica que los creativos están funcionando — mantené el ritmo'}.`;
  }

  // ── Presupuesto / gasto / budget ───────────────────────────────────────────
  if (q.includes('presupuesto') || q.includes('budget') || q.includes('gasto') || q.includes('cuanto gastar') || q.includes('inversion')) {
    const roasText = analysis.avgROAS !== null
      ? `Con ROAS ${analysis.avgROAS.toFixed(1)}x, cada $100 invertidos generan $${(analysis.avgROAS * 100).toFixed(0)} en ventas. `
      : '';
    return `Gastaste $${analysis.totalSpend.toFixed(0)} en total. ${roasText}Distribución ideal del presupuesto: 70% a campañas probadas ("${analysis.topCampaign}" es la mejor), 20% a testeo de nuevas audiencias/creatividades, 10% a retargeting. No aumentes más del 20% diario por campaña o el algoritmo se resetea y pierde optimización.`;
  }

  // ── Campaña específica ─────────────────────────────────────────────────────
  if (q.includes('campana') || q.includes('campañas') || q.includes('mejor campana') || q.includes('cual campana')) {
    if (campaigns.length === 0) return `No hay campañas disponibles todavía.`;
    return `Tenés ${analysis.totalCampaigns} campañas totales (${analysis.activeCampaigns} activas). La mejor es "${analysis.topCampaign}" — enfocá recursos en ella. La que necesita más atención es "${analysis.worstCampaign}". Para ver el detalle de cada campaña, revisá la sección Campañas en el menú.`;
  }

  // ── Default inteligente ────────────────────────────────────────────────────
  const criticalCount = analysis.alerts.filter(
    (a) => a.priority === 'critical' || a.priority === 'high'
  ).length;
  return `Portfolio actual: score ${analysis.healthScore}/100 (${analysis.healthLabel}) | Gasto: $${analysis.totalSpend.toFixed(0)} | CTR: ${analysis.avgCTR.toFixed(2)}%${analysis.avgROAS !== null ? ` | ROAS: ${analysis.avgROAS.toFixed(1)}x` : ''} | Conversiones: ${analysis.totalConversions}${criticalCount > 0 ? ` | ⚠️ ${criticalCount} alertas prioritarias` : ''}. Podés preguntarme sobre: escalar campañas, conversiones, CTR, ROAS, presupuesto, frecuencia, audiencias, creatividades o qué métrica mejorar primero.`;
}
