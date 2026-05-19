import { cookies } from 'next/headers';
import type {
  AdAccount,
  Campaign,
  AdSet,
  Ad,
  InsightsData,
  DailyInsights,
  DateRange,
  PaginatedResponse,
  ConnectionTestResult,
  CampaignStatus,
} from '@/types/meta';

const BASE_URL = 'https://graph.facebook.com';

async function getConfig() {
  let cookieToken: string | undefined;
  let cookieAccountId: string | undefined;
  let cookieVersion: string | undefined;

  try {
    const cookieStore = await cookies();
    cookieToken = cookieStore.get('meta_token')?.value;
    cookieAccountId = cookieStore.get('meta_account_id')?.value;
    cookieVersion = cookieStore.get('meta_api_version')?.value;
  } catch {
    // cookies() may throw outside a request context
  }

  const token = cookieToken || process.env.META_ACCESS_TOKEN;
  const accountId = cookieAccountId || process.env.META_AD_ACCOUNT_ID;
  const version = cookieVersion || process.env.META_API_VERSION || 'v21.0';

  if (!token) throw new Error('Token no configurado. Ingresá tu Access Token en Configuración.');
  if (!accountId) throw new Error('Ad Account ID no configurado. Ingresalo en Configuración.');

  return { token, accountId, version };
}

async function metaFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const { token, version } = await getConfig();
  const url = new URL(`${BASE_URL}/${version}${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const data = await res.json();

  if (!res.ok || data.error) {
    const msg = data.error?.message || `Error HTTP ${res.status}`;
    const code = data.error?.code;
    if (code === 190) throw new Error('Token de acceso vencido o inválido. Generá un nuevo token.');
    if (code === 200 || code === 100) throw new Error('Permisos insuficientes. Verificá los permisos del token.');
    throw new Error(msg);
  }

  return data as T;
}

export async function testConnection(): Promise<ConnectionTestResult> {
  try {
    const { accountId } = await getConfig();
    const account = await metaFetch<AdAccount>(`/${accountId}`, {
      fields: 'id,name,account_status,currency,timezone_name',
    });
    return { success: true, account };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

export async function getAdAccounts(): Promise<AdAccount[]> {
  const data = await metaFetch<PaginatedResponse<AdAccount>>('/me/adaccounts', {
    fields: 'id,name,account_status,currency,timezone_name',
    limit: '100',
  });
  return data.data;
}

const INSIGHTS_FIELDS = [
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
  'spend',
  'impressions',
  'reach',
  'clicks',
  'inline_link_clicks',
  'ctr',
  'cpc',
  'cpm',
  'frequency',
  'actions',
  'cost_per_action_type',
  'purchase_roas',
  'website_purchase_roas',
  'date_start',
  'date_stop',
].join(',');

export async function getCampaigns(
  statuses: CampaignStatus[] = ['ACTIVE', 'PAUSED'],
  dateRange?: DateRange
): Promise<Campaign[]> {
  const { accountId } = await getConfig();
  const params: Record<string, string> = {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,updated_time,created_time',
    limit: '100',
    effective_status: JSON.stringify(statuses.length ? statuses : ['ACTIVE', 'PAUSED', 'ARCHIVED']),
  };
  if (dateRange) {
    params.time_range = JSON.stringify(dateRange);
  }
  const data = await metaFetch<PaginatedResponse<Campaign>>(`/${accountId}/campaigns`, params);
  return data.data;
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  return metaFetch<Campaign>(`/${campaignId}`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,updated_time,created_time',
  });
}

export async function getCampaignInsights(
  campaignId: string,
  dateRange: DateRange,
  level: 'campaign' | 'adset' | 'ad' = 'campaign'
): Promise<InsightsData[]> {
  const data = await metaFetch<PaginatedResponse<InsightsData>>(`/${campaignId}/insights`, {
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify(dateRange),
    level,
    limit: '500',
  });
  return data.data;
}

export async function getCampaignDailyInsights(
  campaignId: string,
  dateRange: DateRange
): Promise<DailyInsights[]> {
  const data = await metaFetch<PaginatedResponse<DailyInsights>>(`/${campaignId}/insights`, {
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify(dateRange),
    time_increment: '1',
    level: 'campaign',
    limit: '500',
  });
  return data.data;
}

export async function getAdSets(
  campaignId: string,
  dateRange?: DateRange
): Promise<AdSet[]> {
  const params: Record<string, string> = {
    fields: 'id,name,campaign_id,status,daily_budget,lifetime_budget,bid_strategy,optimization_goal',
    limit: '100',
  };
  if (dateRange) params.time_range = JSON.stringify(dateRange);
  const data = await metaFetch<PaginatedResponse<AdSet>>(`/${campaignId}/adsets`, params);
  return data.data;
}

export async function getAdSetInsights(
  campaignId: string,
  dateRange: DateRange
): Promise<InsightsData[]> {
  const data = await metaFetch<PaginatedResponse<InsightsData>>(`/${campaignId}/insights`, {
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify(dateRange),
    level: 'adset',
    limit: '500',
  });
  return data.data;
}

export async function getAds(campaignId: string): Promise<Ad[]> {
  const data = await metaFetch<PaginatedResponse<Ad>>(`/${campaignId}/ads`, {
    fields: 'id,name,adset_id,campaign_id,status,creative{id,name,thumbnail_url}',
    limit: '100',
  });
  return data.data;
}

export async function getAdInsights(
  campaignId: string,
  dateRange: DateRange
): Promise<InsightsData[]> {
  const data = await metaFetch<PaginatedResponse<InsightsData>>(`/${campaignId}/insights`, {
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify(dateRange),
    level: 'ad',
    limit: '500',
  });
  return data.data;
}

export async function getAccountInsights(dateRange: DateRange): Promise<InsightsData | null> {
  const { accountId } = await getConfig();
  const data = await metaFetch<PaginatedResponse<InsightsData>>(`/${accountId}/insights`, {
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify(dateRange),
    level: 'account',
    limit: '1',
  });
  return data.data[0] || null;
}

export async function getAccountLevelInsights(
  dateRange: DateRange,
  level: 'adset' | 'ad'
): Promise<InsightsData[]> {
  const { accountId } = await getConfig();
  const data = await metaFetch<PaginatedResponse<InsightsData>>(`/${accountId}/insights`, {
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify(dateRange),
    level,
    limit: '500',
  });
  return data.data;
}
