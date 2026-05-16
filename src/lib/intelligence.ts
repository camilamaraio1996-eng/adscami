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

export function generateChatResponse(
  question: string,
  analysis: PortfolioAnalysis,
  campaigns: CampaignWithInsights[]
): string {
  const q = question.toLowerCase();

  // Escalar
  if (q.includes('escalar') || q.includes('scale') || q.includes('aumentar presupuesto')) {
    const best = campaigns
      .filter((c) => c.insights)
      .sort((a, b) => {
        const rA = getRoas(a.insights!.purchase_roas) || 0;
        const rB = getRoas(b.insights!.purchase_roas) || 0;
        return rB - rA;
      })[0];
    if (best) {
      const roas = getRoas(best.insights!.purchase_roas);
      if (roas && roas >= 2) {
        return `La campaña que más conviene escalar es "${best.name}"${roas ? ` (ROAS ${roas.toFixed(1)}x)` : ''}. Recomiendo aumentar el presupuesto un 20% por día y monitorear las primeras 48 horas. Si el ROAS se mantiene, seguís escalando. No aumentes más del 20% diario o el algoritmo se desestabiliza.`;
      }
    }
    return `Con el portfolio actual (salud ${analysis.healthScore}/100), necesitás al menos 7 días de datos con ROAS > 2x antes de escalar. Primero asegurate de que las campañas estén convirtiendo de manera consistente.`;
  }

  // Ventas / conversiones
  if (
    q.includes('venta') ||
    q.includes('conversiones') ||
    q.includes('compra') ||
    q.includes('purchase')
  ) {
    if (analysis.totalConversions === 0) {
      return `No hay conversiones registradas. Los principales sospechosos son: 1) El píxel de Meta no está disparando el evento Purchase — verificalo con Meta Pixel Helper. 2) La landing page genera fricción — revisá que cargue en menos de 3 segundos en mobile. 3) La oferta no es convincente — revisá precio, beneficios y urgencia. 4) El público objetivo puede no ser el correcto.`;
    }
    const cpa = analysis.totalConversions > 0 ? analysis.totalSpend / analysis.totalConversions : 0;
    return `Tenés ${analysis.totalConversions} conversiones totales con un CPA promedio de $${cpa.toFixed(0)}. Para aumentar conversiones: optimizá la landing para mobile, simplificá el formulario de compra y activá retargeting para carrito abandonado.`;
  }

  // Problema principal
  if (
    q.includes('problema') ||
    q.includes('issue') ||
    q.includes('error') ||
    q.includes('mal')
  ) {
    const criticalAlerts = analysis.alerts.filter(
      (a) => a.priority === 'critical' || a.priority === 'high'
    );
    if (criticalAlerts.length > 0) {
      const top = criticalAlerts[0];
      return `Tu mayor problema es: "${top.title}" — ${top.message} Acción recomendada: ${top.action}. Tenés ${criticalAlerts.length} alertas prioritarias en total que requieren atención.`;
    }
    return `Tu portfolio está en buen estado (${analysis.healthScore}/100). No hay alertas críticas. La principal área de mejora es ${analysis.avgCTR < 1 ? `el CTR promedio (${analysis.avgCTR.toFixed(2)}%)` : analysis.avgFrequency > 3 ? `la frecuencia elevada (${analysis.avgFrequency.toFixed(1)}x)` : 'mantener el rendimiento actual'}.`;
  }

  // CTR
  if (q.includes('ctr') || q.includes('clics') || q.includes('click')) {
    return `Tu CTR promedio es ${analysis.avgCTR.toFixed(2)}%. El benchmark de la industria de Meta Ads es 0.9-1.5%. ${analysis.avgCTR < 0.9 ? 'Estás por debajo del promedio. Para mejorar el CTR: 1) Probá creatividades en video (vs imagen estática). 2) Usá caras humanas en las imágenes. 3) Agregá texto en el anuncio con propuesta de valor clara. 4) Cambiá el copy del CTA.' : 'Estás en buena zona. Para mantenerlo, rotá creatividades cada 2-3 semanas antes de que baje la frecuencia.'}`;
  }

  // CPC
  if (q.includes('cpc') || q.includes('costo por clic')) {
    return `Tu CPC promedio es $${analysis.avgCPC.toFixed(2)}. ${analysis.avgCPC > 5 ? 'Es bastante alto. Para reducirlo: mejorá el CTR (mejor CTR = menor CPC), amplía las audiencias, y revisá la puja (probá "Costo por resultado más bajo" en lugar de puja manual).' : analysis.avgCPC < 1 ? 'Excelente! Estás en zona muy eficiente. Aprovechá para aumentar el volumen de gasto.' : 'Está en rango aceptable. Podés optimizarlo mejorando el relevance score de los anuncios.'}`;
  }

  // Audiencia
  if (
    q.includes('audiencia') ||
    q.includes('público') ||
    q.includes('targeting') ||
    q.includes('segmentación')
  ) {
    const highFreqCampaigns = campaigns.filter(
      (c) => c.insights && parseFloat(c.insights.frequency || '0') > 3
    );
    if (highFreqCampaigns.length > 0) {
      return `${highFreqCampaigns.length} campaña(s) tienen frecuencia alta, lo que indica saturación de audiencia. Recomiendo: 1) Ampliar los criterios de segmentación. 2) Crear Lookalike Audiences basadas en tus compradores actuales. 3) Probar audiencias de intereses diferentes. 4) Usar Advantage+ Audience de Meta para mayor alcance.`;
    }
    return `Tus audiencias parecen saludables (frecuencia promedio ${analysis.avgFrequency.toFixed(1)}x). Para optimizar: probá Lookalike Audiences del 1-3% para mayor precisión y 3-5% para mayor volumen. También activá retargeting de visitantes de sitio.`;
  }

  // Creatividades
  if (
    q.includes('creativo') ||
    q.includes('creative') ||
    q.includes('anuncio') ||
    q.includes('imagen') ||
    q.includes('video')
  ) {
    return `Para creatividades de alto rendimiento en Meta Ads: 1) Video genera 3x más engagement que imagen estática. 2) Los primeros 3 segundos son cruciales — empezá con el "hook". 3) Subtitulos en video (85% lo ve sin sonido). 4) Formato 9:16 para feed y stories. 5) Rotá creatividades cada 2-3 semanas. Tu CTR actual (${analysis.avgCTR.toFixed(2)}%) ${analysis.avgCTR < 1.5 ? 'sugiere que hay margen de mejora en el creativo' : 'indica que los creativos están funcionando bien'}.`;
  }

  // Presupuesto
  if (q.includes('presupuesto') || q.includes('budget') || q.includes('gasto')) {
    return `Gastaste $${analysis.totalSpend.toFixed(0)} en total. ${analysis.avgROAS !== null ? `Con ROAS ${analysis.avgROAS.toFixed(1)}x, cada $1 invertido genera $${analysis.avgROAS.toFixed(2)}. ` : ''}Para distribución de presupuesto: asigná el 70% a campañas probadas y rentables, 20% a testeo de nuevas audiencias/creatividades, y 10% a retargeting.`;
  }

  // ROAS
  if (q.includes('roas') || q.includes('retorno') || q.includes('roi')) {
    if (analysis.avgROAS === null) {
      return `No hay datos de ROAS disponibles. Esto puede ser porque: 1) Las campañas no tienen objetivo de ventas/conversiones. 2) El píxel no está midiendo compras. 3) Los eventos de conversión no están configurados. Configurá el evento Purchase en el píxel para ver el ROAS real.`;
    }
    return `Tu ROAS promedio es ${analysis.avgROAS.toFixed(1)}x. ${analysis.avgROAS >= 3 ? `¡Excelente! Tenés campañas muy rentables. "${analysis.topCampaign}" es tu mejor candidata para escalar.` : analysis.avgROAS >= 1 ? `Estás en positivo pero hay margen de mejora. Optimizá las landing pages y el proceso de compra para mejorar la conversión.` : `Estás perdiendo dinero. Pausá las campañas con ROAS < 1 inmediatamente y revisá la propuesta de valor.`}`;
  }

  // Default
  return `Basándome en tu portfolio: salud ${analysis.healthScore}/100 (${analysis.healthLabel}), gasto total $${analysis.totalSpend.toFixed(0)}, CTR promedio ${analysis.avgCTR.toFixed(2)}%${analysis.avgROAS !== null ? `, ROAS ${analysis.avgROAS.toFixed(1)}x` : ''}. ${analysis.alerts.filter((a) => a.priority === 'critical' || a.priority === 'high').length} alertas prioritarias requieren atención. ¿Querés que profundice en algún tema específico? Podés preguntarme sobre CTR, ROAS, audiencias, creatividades, presupuesto o conversiones.`;
}
