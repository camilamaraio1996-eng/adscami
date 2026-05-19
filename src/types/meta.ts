export interface MetaConfig {
  accessToken: string;
  adAccountId: string;
  businessId?: string;
  apiVersion: string;
}

export interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  spend_cap?: string;
}

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
export type CampaignObjective =
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_APP_PROMOTION'
  | 'OUTCOME_SALES'
  | 'LINK_CLICKS'
  | 'CONVERSIONS'
  | 'MESSAGES'
  | 'VIDEO_VIEWS'
  | 'REACH'
  | 'BRAND_AWARENESS'
  | 'LOCAL_AWARENESS'
  | 'PAGE_LIKES'
  | 'POST_ENGAGEMENT'
  | 'LEAD_GENERATION';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: CampaignObjective | string;
  budget_rebalance_flag?: boolean;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  updated_time?: string;
  created_time?: string;
}

export interface AdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: CampaignStatus;
  daily_budget?: string;
  lifetime_budget?: string;
  targeting?: Record<string, unknown>;
  bid_strategy?: string;
  billing_event?: string;
  optimization_goal?: string;
}

export interface Ad {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: CampaignStatus;
  creative?: {
    id: string;
    name?: string;
    thumbnail_url?: string;
    image_url?: string;
    video_id?: string;
  };
}

export interface ActionValue {
  action_type: string;
  value: string;
}

export interface InsightsData {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  effective_status?: string;
  spend: string;
  impressions: string;
  reach: string;
  clicks: string;
  inline_link_clicks?: string;
  ctr: string;
  cpc?: string;
  cpm: string;
  frequency: string;
  actions?: ActionValue[];
  cost_per_action_type?: ActionValue[];
  purchase_roas?: ActionValue[];
  website_purchase_roas?: ActionValue[];
  date_start: string;
  date_stop: string;
}

export interface DailyInsights extends InsightsData {
  date_start: string;
  date_stop: string;
}

export interface CampaignWithInsights extends Campaign {
  insights?: InsightsData;
  daily_insights?: DailyInsights[];
  score?: CampaignScore;
  diagnostics?: Diagnostic[];
}

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7d'
  | 'last_30d'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DateRange {
  since: string;
  until: string;
}

export interface FilterState {
  datePreset: DatePreset;
  dateRange: DateRange;
  campaignIds: string[];
  statuses: CampaignStatus[];
  objectives: string[];
  platforms: string[];
  level: 'campaign' | 'adset' | 'ad';
  search: string;
}

export interface CampaignScore {
  total: number;
  label: 'Excelente' | 'Buena' | 'Regular' | 'Mala' | 'Crítica';
  breakdown: {
    ctr: number;
    cpc: number;
    cpm: number;
    frequency: number;
    costPerResult: number;
    roas: number;
    conversion: number;
    trend: number;
  };
  reasons: string[];
}

export type DiagnosticSeverity = 'alta' | 'media' | 'baja';

export interface Diagnostic {
  id: string;
  severity: DiagnosticSeverity;
  problem: string;
  explanation: string;
  recommendation: string;
  action: string;
}

export interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  account?: AdAccount;
  error?: string;
}

export interface Alert {
  id: string;
  campaignId?: string;
  campaignName?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'performance' | 'creative' | 'audience' | 'pixel' | 'budget' | 'funnel';
  title: string;
  message: string;
  metric?: string;
  value?: string;
  threshold?: string;
  action: string;
  timestamp: string;
}

export interface AIInsight {
  id: string;
  type: 'positive' | 'negative' | 'opportunity' | 'warning' | 'prediction';
  title: string;
  detail: string;
  impact: 'high' | 'medium' | 'low';
  action?: string;
  metric?: string;
  value?: string;
  emoji: string;
}

export interface FunnelStep {
  label: string;
  value: number;
  percentage: number;
  dropoff: number;
  color: string;
  icon: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'budget' | 'creative' | 'audience' | 'bid' | 'scale';
  triggeredCount: number;
  lastTriggered?: string;
}

export interface KPIConfig {
  targetCTR: number;
  targetCPC: number;
  targetCPM: number;
  targetCPA: number;
  targetROAS: number;
  targetFrequency: number;
  currency: string;
  industry: string;
}

export interface PortfolioAnalysis {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgCPC: number;
  avgCPM: number;
  avgROAS: number | null;
  avgFrequency: number;
  healthScore: number;
  healthLabel: string;
  alerts: Alert[];
  insights: AIInsight[];
  topCampaign: string;
  worstCampaign: string;
  totalCampaigns: number;
  activeCampaigns: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}
