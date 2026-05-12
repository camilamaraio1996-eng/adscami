'use client';

import { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PRESETS = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last_7d', label: 'Últimos 7 días' },
  { value: 'last_30d', label: 'Últimos 30 días' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'last_month', label: 'Mes anterior' },
];

interface DateRangePickerProps {
  preset: string;
  onChange: (preset: string, since?: string, until?: string) => void;
}

export function DateRangePicker({ preset, onChange }: DateRangePickerProps) {
  const [customSince, setCustomSince] = useState('');
  const [customUntil, setCustomUntil] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const currentLabel = PRESETS.find((p) => p.value === preset)?.label || 'Personalizado';

  const applyCustom = () => {
    if (customSince && customUntil) {
      onChange('custom', customSince, customUntil);
      setShowCustom(false);
    }
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs text-white/60 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors">
          <Calendar className="w-3.5 h-3.5" />
          {currentLabel}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-[#111] border-white/[0.08] text-white shadow-2xl"
        >
          {PRESETS.map((p) => (
            <DropdownMenuItem
              key={p.value}
              onClick={() => { onChange(p.value); setShowCustom(false); }}
              className={`text-xs cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06] ${
                preset === p.value ? 'text-white' : 'text-white/60'
              }`}
            >
              {p.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-white/[0.06]" />
          <DropdownMenuItem
            onClick={() => setShowCustom(!showCustom)}
            className="text-xs cursor-pointer text-white/60 hover:bg-white/[0.06] focus:bg-white/[0.06]"
          >
            Personalizado
          </DropdownMenuItem>
          {showCustom && (
            <div className="px-2 py-2 space-y-1.5">
              <input
                type="date"
                value={customSince}
                onChange={(e) => setCustomSince(e.target.value)}
                className="w-full text-xs bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-white"
              />
              <input
                type="date"
                value={customUntil}
                onChange={(e) => setCustomUntil(e.target.value)}
                className="w-full text-xs bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-white"
              />
              <Button
                size="sm"
                onClick={applyCustom}
                className="w-full h-6 text-xs bg-white/[0.08] hover:bg-white/[0.12] text-white"
              >
                Aplicar
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
