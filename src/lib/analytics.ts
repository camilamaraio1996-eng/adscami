import type { InsightsData, ActionValue } from '@/types/meta';

export function getActionValue(actions: ActionValue[] | undefined, actionType: string): number {
  if (!actions) return 0;
  const action = actions.find((a) => a.action_type === actionType);
  return action ? parseFloat(action.value) : 0;
}

export function getActionCost(
  costPerAction: ActionValue[] | undefined,
  actionType: string
): number {
  if (!costPerAction) return 0;
  const item = costPerAction.find((a) => a.action_type === actionType);
  return item ? parseFloat(item.value) : 0;
}

export function getRoas(roasData: ActionValue[] | undefined): number | null {
  if (!roasData || roasData.length === 0) return null;
  const item = roasData.find(
    (a) => a.action_type === 'omni_purchase' || a.action_type === 'purchase'
  );
  if (!item) return roasData[0] ? parseFloat(roasData[0].value) : null;
  return parseFloat(item.value);
}

export function aggregateInsights(insights: InsightsData[]): InsightsData | null {
  if (!insights || insights.length === 0) return null;

  const totals = insights.reduce(
    (acc, ins) => {
      acc.spend += parseFloat(ins.spend || '0');
      acc.impressions += parseInt(ins.impressions || '0', 10);
      acc.reach += parseInt(ins.reach || '0', 10);
      acc.clicks += parseInt(ins.clicks || '0', 10);
      acc.inline_link_clicks += parseInt(ins.inline_link_clicks || '0', 10);
      return acc;
    },
    { spend: 0, impressions: 0, reach: 0, clicks: 0, inline_link_clicks: 0 }
  );

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;

  const aggregatedActions = aggregateActions(insights.map((i) => i.actions || []));

  return {
    spend: totals.spend.toFixed(2),
    impressions: totals.impressions.toString(),
    reach: totals.reach.toString(),
    clicks: totals.clicks.toString(),
    inline_link_clicks: totals.inline_link_clicks.toString(),
    ctr: ctr.toFixed(4),
    cpc: cpc.toFixed(2),
    cpm: cpm.toFixed(2),
    frequency: '0',
    actions: aggregatedActions,
    date_start: insights[0]?.date_start || '',
    date_stop: insights[insights.length - 1]?.date_stop || '',
  };
}

function aggregateActions(actionArrays: ActionValue[][]): ActionValue[] {
  const map = new Map<string, number>();
  for (const actions of actionArrays) {
    for (const action of actions) {
      map.set(action.action_type, (map.get(action.action_type) || 0) + parseFloat(action.value));
    }
  }
  return Array.from(map.entries()).map(([action_type, value]) => ({
    action_type,
    value: value.toString(),
  }));
}

export function formatCurrency(value: number | string, currency = 'USD'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('es-AR').format(Math.round(num));
}

export function formatPercent(value: number | string, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

export function getDateRangeParams(preset: string, customSince?: string, customUntil?: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { since: fmt(today), until: fmt(today) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { since: fmt(y), until: fmt(y) };
    }
    case 'last_7d': {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { since: fmt(s), until: fmt(today) };
    }
    case 'last_30d': {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      return { since: fmt(s), until: fmt(today) };
    }
    case 'this_month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { since: fmt(s), until: fmt(today) };
    }
    case 'last_month': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { since: fmt(s), until: fmt(e) };
    }
    case 'custom':
      return { since: customSince || fmt(today), until: customUntil || fmt(today) };
    default: {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      return { since: fmt(s), until: fmt(today) };
    }
  }
}

export function getObjectiveLabel(objective: string): string {
  const map: Record<string, string> = {
    AWARENESS: 'Reconocimiento',
    TRAFFIC: 'Tráfico',
    ENGAGEMENT: 'Interacción',
    LEADS: 'Clientes potenciales',
    APP_PROMOTION: 'Promoción de app',
    SALES: 'Ventas',
    OUTCOME_AWARENESS: 'Reconocimiento',
    OUTCOME_TRAFFIC: 'Tráfico',
    OUTCOME_ENGAGEMENT: 'Interacción',
    OUTCOME_LEADS: 'Clientes potenciales',
    OUTCOME_APP_PROMOTION: 'Promoción de app',
    OUTCOME_SALES: 'Ventas',
    LINK_CLICKS: 'Clics en enlace',
    CONVERSIONS: 'Conversiones',
    MESSAGES: 'Mensajes',
    VIDEO_VIEWS: 'Reproducciones',
    REACH: 'Alcance',
    LEAD_GENERATION: 'Generación de leads',
    PAGE_LIKES: 'Me gusta de página',
    POST_ENGAGEMENT: 'Interacción con publicación',
  };
  return map[objective] || objective;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    ARCHIVED: 'Archivada',
    DELETED: 'Eliminada',
  };
  return map[status] || status;
}
