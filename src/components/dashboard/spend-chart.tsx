'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyInsights } from '@/types/meta';
import { formatCurrency } from '@/lib/analytics';

interface SpendChartProps {
  data: DailyInsights[];
  title?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-medium text-white">
          {p.name === 'spend' ? formatCurrency(p.value) : p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

export function SpendChart({ data, title = 'Gasto diario' }: SpendChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date_start).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
    spend: parseFloat(d.spend),
    clicks: parseInt(d.clicks),
    ctr: parseFloat(d.ctr),
  }));

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-sm font-medium text-white mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="spend"
            name="spend"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#spendGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CtrCpcChart({ data }: { data: DailyInsights[] }) {
  const chartData = data.map((d) => ({
    date: new Date(d.date_start).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
    ctr: parseFloat(d.ctr),
    cpc: parseFloat(d.cpc || '0'),
  }));

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-sm font-medium text-white mb-4">CTR y CPC por día</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="ctrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cpcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="ctr" name="CTR %" stroke="#8b5cf6" strokeWidth={2} fill="url(#ctrGrad)" dot={false} />
          <Area type="monotone" dataKey="cpc" name="CPC $" stroke="#f59e0b" strokeWidth={2} fill="url(#cpcGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
