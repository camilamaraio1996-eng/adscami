'use client';

import { Filter } from 'lucide-react';
import type { CampaignStatus } from '@/types/meta';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: { value: CampaignStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Activas', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20' },
  { value: 'PAUSED', label: 'Pausadas', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20' },
  { value: 'ARCHIVED', label: 'Archivadas', color: 'text-white/40 border-white/10 bg-white/5 hover:bg-white/10' },
];

interface CampaignFiltersProps {
  statuses: CampaignStatus[];
  onStatusChange: (statuses: CampaignStatus[]) => void;
}

export function CampaignFilters({ statuses, onStatusChange }: CampaignFiltersProps) {
  const toggle = (s: CampaignStatus) => {
    if (statuses.includes(s)) {
      onStatusChange(statuses.filter((x) => x !== s));
    } else {
      onStatusChange([...statuses, s]);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-white/30">
        <Filter className="w-3 h-3" />
        <span>Estado:</span>
      </div>
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => toggle(opt.value)}
          className={cn(
            'text-xs px-2.5 py-1 rounded-lg border transition-all',
            statuses.includes(opt.value)
              ? opt.color
              : 'text-white/30 border-white/[0.06] bg-transparent hover:bg-white/[0.04]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
