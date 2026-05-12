'use client';

import { useState } from 'react';
import { Download, Copy, Check, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CampaignWithInsights, InsightsData } from '@/types/meta';
import { formatCurrency, formatNumber, formatPercent, getActionValue, getRoas } from '@/lib/analytics';

interface ReportGeneratorProps {
  campaigns: CampaignWithInsights[];
  accountInsights?: InsightsData | null;
  dateLabel?: string;
}

export function ReportGenerator({ campaigns, accountInsights, dateLabel = 'últimos 30 días' }: ReportGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [copiedClient, setCopiedClient] = useState(false);

  const spend = parseFloat(accountInsights?.spend || '0');
  const totalLeads = campaigns.reduce((s, c) => s + getActionValue(c.insights?.actions, 'lead'), 0);
  const totalPurchases = campaigns.reduce((s, c) => s + getActionValue(c.insights?.actions, 'purchase'), 0);
  const totalResults = totalLeads + totalPurchases;
  const cpa = totalResults > 0 ? spend / totalResults : 0;

  const bestCampaign = campaigns
    .filter((c) => c.insights)
    .sort((a, b) => {
      const aScore = getActionValue(a.insights?.actions, 'lead') + getActionValue(a.insights?.actions, 'purchase');
      const bScore = getActionValue(b.insights?.actions, 'lead') + getActionValue(b.insights?.actions, 'purchase');
      return bScore - aScore;
    })[0];

  const generateClientSummary = () => {
    return `📊 Resumen de campaña — ${dateLabel}

Durante el período analizado se invirtieron ${formatCurrency(spend)}, se obtuvieron ${formatNumber(totalResults)} resultado${totalResults !== 1 ? 's' : ''} con un costo promedio de ${formatCurrency(cpa)}.

${bestCampaign ? `✅ La campaña con mejor rendimiento fue "${bestCampaign.name}".` : ''}

${totalLeads > 0 ? `🎯 Leads generados: ${formatNumber(totalLeads)}` : ''}${totalPurchases > 0 ? `\n🛒 Compras: ${formatNumber(totalPurchases)}` : ''}

📈 Métricas clave:
• CTR promedio: ${formatPercent(parseFloat(accountInsights?.ctr || '0'))}
• CPC: ${formatCurrency(parseFloat(accountInsights?.cpc || '0'))}
• CPM: ${formatCurrency(parseFloat(accountInsights?.cpm || '0'))}

Generado con Meta Ads Pro`;
  };

  const generateTechnicalSummary = () => {
    let text = `META ADS - REPORTE TÉCNICO\n`;
    text += `Período: ${dateLabel}\n\n`;
    text += `MÉTRICAS GLOBALES\n`;
    text += `Gasto: ${formatCurrency(spend)}\n`;
    text += `Impresiones: ${formatNumber(parseInt(accountInsights?.impressions || '0', 10))}\n`;
    text += `Alcance: ${formatNumber(parseInt(accountInsights?.reach || '0', 10))}\n`;
    text += `Clics: ${formatNumber(parseInt(accountInsights?.clicks || '0', 10))}\n`;
    text += `CTR: ${formatPercent(parseFloat(accountInsights?.ctr || '0'))}\n`;
    text += `CPC: ${formatCurrency(parseFloat(accountInsights?.cpc || '0'))}\n`;
    text += `CPM: ${formatCurrency(parseFloat(accountInsights?.cpm || '0'))}\n`;
    text += `Leads: ${formatNumber(totalLeads)}\n`;
    text += `Compras: ${formatNumber(totalPurchases)}\n`;
    text += `CPA: ${formatCurrency(cpa)}\n\n`;
    text += `CAMPAÑAS\n`;
    campaigns.forEach((c) => {
      const ins = c.insights;
      if (!ins) return;
      const roas = getRoas(ins.purchase_roas);
      text += `\n${c.name}\n`;
      text += `  Estado: ${c.status}\n`;
      text += `  Gasto: ${formatCurrency(parseFloat(ins.spend))}\n`;
      text += `  CTR: ${formatPercent(parseFloat(ins.ctr))}\n`;
      text += `  CPC: ${formatCurrency(parseFloat(ins.cpc || '0'))}\n`;
      text += `  Leads: ${formatNumber(getActionValue(ins.actions, 'lead'))}\n`;
      text += `  Compras: ${formatNumber(getActionValue(ins.actions, 'purchase'))}\n`;
      if (roas !== null) text += `  ROAS: ${roas.toFixed(2)}x\n`;
    });
    return text;
  };

  const exportCSV = () => {
    const headers = ['Campaña', 'Estado', 'Gasto', 'Impresiones', 'Clics', 'CTR', 'CPC', 'CPM', 'Leads', 'Compras', 'ROAS', 'Frecuencia'];
    const rows = campaigns.map((c) => {
      const ins = c.insights;
      const roas = getRoas(ins?.purchase_roas);
      return [
        `"${c.name}"`,
        c.status,
        parseFloat(ins?.spend || '0').toFixed(2),
        ins?.impressions || '0',
        ins?.clicks || '0',
        parseFloat(ins?.ctr || '0').toFixed(4),
        parseFloat(ins?.cpc || '0').toFixed(2),
        parseFloat(ins?.cpm || '0').toFixed(2),
        getActionValue(ins?.actions, 'lead'),
        getActionValue(ins?.actions, 'purchase'),
        roas !== null ? roas.toFixed(2) : '',
        parseFloat(ins?.frequency || '0').toFixed(2),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meta-ads-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
      <p className="text-sm font-medium text-white flex items-center gap-2">
        <FileText className="w-4 h-4 text-white/40" />
        Exportar reporte
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={exportCSV}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-xs font-medium text-white">Exportar CSV</p>
            <p className="text-[10px] text-white/30">Todas las campañas con métricas</p>
          </div>
          <Download className="w-3.5 h-3.5 text-white/30 ml-auto" />
        </button>

        <button
          onClick={() => copyText(generateTechnicalSummary(), setCopied)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
          <div>
            <p className="text-xs font-medium text-white">Copiar resumen técnico</p>
            <p className="text-[10px] text-white/30">Para tu equipo o propia referencia</p>
          </div>
        </button>

        <button
          onClick={() => copyText(generateClientSummary(), setCopiedClient)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left sm:col-span-2"
        >
          {copiedClient ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-violet-400" />}
          <div>
            <p className="text-xs font-medium text-white">Copiar resumen para cliente</p>
            <p className="text-[10px] text-white/30">Listo para enviar por WhatsApp o email</p>
          </div>
        </button>
      </div>

      {/* Client summary preview */}
      <div className="rounded-lg bg-black/30 border border-white/[0.06] p-3">
        <p className="text-[10px] text-white/30 mb-2">Vista previa — resumen para cliente</p>
        <pre className="text-xs text-white/50 whitespace-pre-wrap font-sans leading-relaxed">
          {generateClientSummary()}
        </pre>
      </div>
    </div>
  );
}
