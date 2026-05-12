'use client';

import { Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  showDatePicker?: boolean;
  datePreset?: string;
  onDateChange?: (preset: string, since?: string, until?: string) => void;
}

export function Header({
  title,
  subtitle,
  onRefresh,
  loading,
  showDatePicker = false,
  datePreset,
  onDateChange,
}: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {showDatePicker && onDateChange && (
          <DateRangePicker preset={datePreset || 'last_30d'} onChange={onDateChange} />
        )}
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/[0.06]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/[0.06]"
        >
          <Bell className="w-3.5 h-3.5" />
        </Button>
      </div>
    </header>
  );
}
