'use client';

import type { CampaignScore } from '@/types/meta';
import { cn } from '@/lib/utils';

const LABEL_CONFIG = {
  Excelente: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', ring: 'stroke-emerald-400' },
  Buena: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', ring: 'stroke-blue-400' },
  Regular: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', ring: 'stroke-yellow-400' },
  Mala: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', ring: 'stroke-orange-400' },
  Crítica: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', ring: 'stroke-rose-400' },
};

interface CampaignScoreCardProps {
  score: CampaignScore;
}

export function CampaignScoreCard({ score }: CampaignScoreCardProps) {
  const config = LABEL_CONFIG[score.label];
  const pct = score.total;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className={cn('rounded-xl border p-5', config.bg, config.border)}>
      <div className="flex items-center gap-5">
        {/* Circular score */}
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
            <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="44" cy="44" r={r} fill="none"
              strokeWidth="6"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={cn('transition-all duration-700', config.ring)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-xl font-bold', config.color)}>{score.total}</span>
            <span className="text-[10px] text-white/30">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border', config.color, config.bg, config.border)}>
            {score.label}
          </span>
          {score.reasons.length > 0 && (
            <ul className="mt-2 space-y-1">
              {score.reasons.slice(0, 3).map((r, i) => (
                <li key={i} className="text-xs text-white/40 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { label: 'CTR', value: score.breakdown.ctr, max: 15 },
          { label: 'CPC', value: score.breakdown.cpc, max: 15 },
          { label: 'CPM', value: score.breakdown.cpm, max: 10 },
          { label: 'Freq.', value: score.breakdown.frequency, max: 10 },
          { label: 'CPA', value: score.breakdown.costPerResult, max: 25 },
          { label: 'ROAS', value: score.breakdown.roas, max: 15 },
          { label: 'Tend.', value: score.breakdown.trend, max: 10 },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-[10px] text-white/30 mb-1">{item.label}</div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', config.ring.replace('stroke-', 'bg-'))}
                style={{ width: `${(item.value / item.max) * 100}%` }}
              />
            </div>
            <div className={cn('text-[10px] mt-0.5 font-medium', config.color)}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
