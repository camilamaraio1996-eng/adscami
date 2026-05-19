'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Brain,
  Send,
  Shield,
  Trophy,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { InsightCard } from '@/components/intelligence/insight-card';
import { AlertItem } from '@/components/intelligence/alert-item';
import { FunnelChart } from '@/components/intelligence/funnel-chart';
import { useCampaigns } from '@/hooks/use-meta-data';
import {
  generatePortfolioAnalysis,
  getSmartRecommendations,
  buildFunnel,
  generateChatResponse,
} from '@/lib/intelligence';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  '¿Qué campaña debería escalar?',
  '¿Por qué no tengo ventas?',
  '¿Qué métrica debo mejorar primero?',
  '¿Cuál es mi mayor problema?',
];

const riskColors = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const riskLabels = {
  low: 'Riesgo bajo',
  medium: 'Riesgo moderado',
  high: 'Riesgo alto',
  critical: 'Riesgo crítico',
};

const healthColor = (score: number) =>
  score >= 80
    ? 'text-emerald-400'
    : score >= 60
    ? 'text-blue-400'
    : score >= 40
    ? 'text-amber-400'
    : 'text-rose-400';

export default function IntelligencePage() {
  const { campaigns, loading, refetch } = useCampaigns('last_30d');

  const analysis = useMemo(
    () => (campaigns.length > 0 ? generatePortfolioAnalysis(campaigns) : null),
    [campaigns]
  );

  const recommendations = useMemo(
    () => getSmartRecommendations(campaigns),
    [campaigns]
  );

  // Best campaign funnel
  const bestCampaignInsights = useMemo(() => {
    if (!analysis || !campaigns.length) return null;
    const best = campaigns.find((c) => c.name === analysis.topCampaign && c.insights);
    return best?.insights ?? campaigns.find((c) => c.insights)?.insights ?? null;
  }, [analysis, campaigns]);

  const funnel = useMemo(
    () => (bestCampaignInsights ? buildFunnel(bestCampaignInsights) : []),
    [bestCampaignInsights]
  );

  const [hasClaudeKey, setHasClaudeKey] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetch('/api/meta/get-config')
      .then((r) => r.json())
      .then((d) => setHasClaudeKey(!!d.hasClaudeKey))
      .catch(() => {});
  }, []);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy tu analista AI de Meta Ads. Puedo ayudarte a interpretar tus datos, identificar problemas y encontrar oportunidades de mejora. ¿En qué puedo ayudarte?',
    },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (hasClaudeKey) {
      setMessages([
        {
          role: 'assistant',
          content:
            '¡Hola! Soy tu analista AI powered by Claude. Puedo analizar tus datos en profundidad y darte recomendaciones precisas. ¿En qué puedo ayudarte?',
        },
      ]);
    }
  }, [hasClaudeKey]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    try {
      if (hasClaudeKey) {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: question,
            portfolioContext: analysis ?? {},
            campaigns: campaigns.slice(0, 10),
          }),
        });
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.response || data.error || 'Error al consultar Claude.',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const response = generateChatResponse(
          question,
          analysis ?? {
            totalSpend: 0,
            totalImpressions: 0,
            totalClicks: 0,
            totalConversions: 0,
            avgCTR: 0,
            avgCPC: 0,
            avgCPM: 0,
            avgROAS: null,
            avgFrequency: 0,
            healthScore: 50,
            healthLabel: 'Sin datos',
            alerts: [],
            insights: [],
            topCampaign: 'N/A',
            worstCampaign: 'N/A',
            totalCampaigns: 0,
            activeCampaigns: 0,
            riskLevel: 'low',
          },
          campaigns
        );
        const assistantMsg: ChatMessage = { role: 'assistant', content: response };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Intelligence"
        subtitle="AI Performance Analysis"
        onRefresh={refetch}
        loading={loading}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Section 1: Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Health Score */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-violet-400" />
              <p className="text-sm font-medium text-white/70">Salud del Portfolio</p>
            </div>
            {analysis ? (
              <>
                <div className="flex items-end gap-2 mb-2">
                  <span
                    className={cn('text-5xl font-bold tabular-nums', healthColor(analysis.healthScore))}
                  >
                    {analysis.healthScore}
                  </span>
                  <span className="text-white/30 text-lg mb-1">/100</span>
                </div>
                <p className={cn('text-sm font-semibold', healthColor(analysis.healthScore))}>
                  {analysis.healthLabel}
                </p>
                <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${analysis.healthScore}%`,
                      background:
                        analysis.healthScore >= 80
                          ? '#10b981'
                          : analysis.healthScore >= 60
                          ? '#3b82f6'
                          : analysis.healthScore >= 40
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="shimmer h-12 rounded-lg" />
            )}
          </div>

          {/* Risk Level */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-white/30" />
              <p className="text-sm font-medium text-white/70">Nivel de Riesgo</p>
            </div>
            {analysis ? (
              <>
                <span
                  className={cn(
                    'inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-semibold',
                    riskColors[analysis.riskLevel]
                  )}
                >
                  {riskLabels[analysis.riskLevel]}
                </span>
                <div className="mt-3 space-y-1.5">
                  <p className="text-[11px] text-white/30">
                    {analysis.alerts.filter((a) => a.priority === 'critical').length} alertas críticas
                  </p>
                  <p className="text-[11px] text-white/30">
                    {analysis.alerts.filter((a) => a.priority === 'high').length} alertas altas
                  </p>
                </div>
              </>
            ) : (
              <div className="shimmer h-8 rounded-lg" />
            )}
          </div>

          {/* Top Campaign */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-medium text-white/70">Mejor Campaña</p>
            </div>
            {analysis ? (
              <>
                <p className="text-sm font-semibold text-white line-clamp-2">
                  {analysis.topCampaign}
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-[11px] text-white/30">
                    Campañas activas: {analysis.activeCampaigns}/{analysis.totalCampaigns}
                  </p>
                  <p className="text-[11px] text-white/30">
                    Conversiones totales: {analysis.totalConversions}
                  </p>
                </div>
              </>
            ) : (
              <div className="shimmer h-8 rounded-lg" />
            )}
          </div>
        </div>

        {/* Section 2: AI Insights Feed */}
        {analysis && analysis.insights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Insights AI</h2>
              <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
                {analysis.insights.length} insights
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.insights.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Alerts Center */}
        {analysis && analysis.alerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-semibold text-white">Centro de Alertas</h2>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                {analysis.alerts.length} alertas
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.alerts.map((alert, i) => (
                <AlertItem key={alert.id} alert={alert} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Funnel Analysis */}
        {funnel.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Análisis de Embudo</h2>
              {analysis && (
                <span className="text-[10px] text-white/30">{analysis.topCampaign}</span>
              )}
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <FunnelChart steps={funnel} />
            </div>
          </div>
        )}

        {/* Section 5: Smart Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Recomendaciones</h2>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 flex items-start gap-3 animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-amber-400">{i + 1}</span>
                </div>
                <p className="text-[13px] text-white/70 leading-relaxed">{rec}</p>
                <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: AI Chat */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Chat con AI</h2>
            <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
              Análisis en tiempo real
            </span>
            {hasClaudeKey && (
              <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full ml-1">
                ✦ Claude AI
              </span>
            )}
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] overflow-hidden">
            {/* Suggested questions */}
            <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-white/30">Preguntas sugeridas:</span>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={chatLoading}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors border border-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                    msg.role === 'user'
                      ? 'ml-auto bg-violet-600/30 text-violet-100 border border-violet-500/30'
                      : 'bg-white/[0.04] text-white/80 border border-white/[0.06]'
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div className="bg-white/[0.04] text-white/80 border border-white/[0.06] max-w-[85%] rounded-xl px-3.5 py-2.5">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/[0.05] flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Preguntá sobre tus campañas…"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2 text-[13px] text-white placeholder-white/20 outline-none focus:border-violet-500/40 transition-colors"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || chatLoading}
                className="w-9 h-9 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
