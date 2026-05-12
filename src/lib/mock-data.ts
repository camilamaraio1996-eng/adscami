import type { CampaignWithInsights, DailyInsights } from '@/types/meta';

export const MOCK_CAMPAIGNS: CampaignWithInsights[] = [
  {
    id: '1001',
    name: 'Campaña Ventas - Producto Principal',
    status: 'ACTIVE',
    objective: 'OUTCOME_SALES',
    daily_budget: '5000',
    start_time: '2025-04-01T00:00:00+0000',
    updated_time: '2025-05-10T12:00:00+0000',
    insights: {
      campaign_id: '1001',
      campaign_name: 'Campaña Ventas - Producto Principal',
      spend: '12450.50',
      impressions: '485320',
      reach: '312000',
      clicks: '9706',
      inline_link_clicks: '8200',
      ctr: '2.00',
      cpc: '1.28',
      cpm: '25.65',
      frequency: '1.56',
      actions: [
        { action_type: 'purchase', value: '87' },
        { action_type: 'add_to_cart', value: '312' },
        { action_type: 'initiate_checkout', value: '145' },
        { action_type: 'landing_page_view', value: '6800' },
        { action_type: 'link_click', value: '9706' },
      ],
      cost_per_action_type: [
        { action_type: 'purchase', value: '143.11' },
        { action_type: 'add_to_cart', value: '39.90' },
      ],
      purchase_roas: [{ action_type: 'omni_purchase', value: '3.24' }],
      date_start: '2025-04-12',
      date_stop: '2025-05-12',
    },
  },
  {
    id: '1002',
    name: 'Generación de Leads - Consultoría',
    status: 'ACTIVE',
    objective: 'OUTCOME_LEADS',
    daily_budget: '3000',
    start_time: '2025-04-15T00:00:00+0000',
    updated_time: '2025-05-10T12:00:00+0000',
    insights: {
      campaign_id: '1002',
      campaign_name: 'Generación de Leads - Consultoría',
      spend: '8320.00',
      impressions: '620000',
      reach: '490000',
      clicks: '4340',
      inline_link_clicks: '3800',
      ctr: '0.70',
      cpc: '1.92',
      cpm: '13.42',
      frequency: '1.27',
      actions: [
        { action_type: 'lead', value: '156' },
        { action_type: 'landing_page_view', value: '3200' },
        { action_type: 'link_click', value: '4340' },
      ],
      cost_per_action_type: [
        { action_type: 'lead', value: '53.33' },
      ],
      date_start: '2025-04-15',
      date_stop: '2025-05-12',
    },
  },
  {
    id: '1003',
    name: 'Mensajes WhatsApp - Oferta Especial',
    status: 'ACTIVE',
    objective: 'MESSAGES',
    daily_budget: '2000',
    start_time: '2025-05-01T00:00:00+0000',
    updated_time: '2025-05-10T12:00:00+0000',
    insights: {
      campaign_id: '1003',
      campaign_name: 'Mensajes WhatsApp - Oferta Especial',
      spend: '2140.00',
      impressions: '98500',
      reach: '76000',
      clicks: '1872',
      inline_link_clicks: '1650',
      ctr: '1.90',
      cpc: '1.14',
      cpm: '21.73',
      frequency: '1.30',
      actions: [
        { action_type: 'messaging_conversation_started_7d', value: '89' },
        { action_type: 'link_click', value: '1872' },
      ],
      cost_per_action_type: [
        { action_type: 'messaging_conversation_started_7d', value: '24.04' },
      ],
      date_start: '2025-05-01',
      date_stop: '2025-05-12',
    },
  },
  {
    id: '1004',
    name: 'Retargeting - Carrito Abandonado',
    status: 'PAUSED',
    objective: 'OUTCOME_SALES',
    daily_budget: '1500',
    start_time: '2025-03-01T00:00:00+0000',
    updated_time: '2025-04-30T12:00:00+0000',
    insights: {
      campaign_id: '1004',
      campaign_name: 'Retargeting - Carrito Abandonado',
      spend: '4200.00',
      impressions: '52000',
      reach: '8500',
      clicks: '2340',
      inline_link_clicks: '2100',
      ctr: '4.50',
      cpc: '1.79',
      cpm: '80.77',
      frequency: '6.12',
      actions: [
        { action_type: 'purchase', value: '45' },
        { action_type: 'initiate_checkout', value: '98' },
        { action_type: 'add_to_cart', value: '67' },
      ],
      cost_per_action_type: [
        { action_type: 'purchase', value: '93.33' },
      ],
      purchase_roas: [{ action_type: 'omni_purchase', value: '5.80' }],
      date_start: '2025-03-01',
      date_stop: '2025-04-30',
    },
  },
  {
    id: '1005',
    name: 'Tráfico Blog - Awareness',
    status: 'ACTIVE',
    objective: 'TRAFFIC',
    daily_budget: '1000',
    start_time: '2025-04-20T00:00:00+0000',
    updated_time: '2025-05-10T12:00:00+0000',
    insights: {
      campaign_id: '1005',
      campaign_name: 'Tráfico Blog - Awareness',
      spend: '1890.00',
      impressions: '890000',
      reach: '720000',
      clicks: '2670',
      inline_link_clicks: '2400',
      ctr: '0.30',
      cpc: '0.71',
      cpm: '2.12',
      frequency: '1.24',
      actions: [
        { action_type: 'landing_page_view', value: '1980' },
        { action_type: 'link_click', value: '2670' },
      ],
      date_start: '2025-04-20',
      date_stop: '2025-05-12',
    },
  },
];

export function generateMockDailyInsights(campaignId: string, days = 14): DailyInsights[] {
  const result: DailyInsights[] = [];
  const today = new Date();
  const base = MOCK_CAMPAIGNS.find((c) => c.id === campaignId);
  const spend = base?.insights ? parseFloat(base.insights.spend) / days : 100;
  const cpc = base?.insights?.cpc ? parseFloat(base.insights.cpc) : 1.5;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const variation = 0.8 + Math.random() * 0.4;
    const dayCpc = cpc * (1 + (i / days) * 0.3) * variation;
    const daySpend = spend * variation;
    const impressions = Math.round((daySpend / (dayCpc * 0.02)) * 100);
    const clicks = Math.round(impressions * 0.02 * variation);

    result.push({
      campaign_id: campaignId,
      spend: daySpend.toFixed(2),
      impressions: impressions.toString(),
      reach: Math.round(impressions * 0.85).toString(),
      clicks: clicks.toString(),
      ctr: ((clicks / impressions) * 100).toFixed(4),
      cpc: dayCpc.toFixed(2),
      cpm: ((daySpend / impressions) * 1000).toFixed(2),
      frequency: (1 + Math.random() * 0.5).toFixed(2),
      date_start: dateStr,
      date_stop: dateStr,
    });
  }

  return result;
}
