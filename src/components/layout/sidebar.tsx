'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Brain,
  Megaphone,
  GitCompare,
  Settings,
  BarChart3,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'ANÁLISIS',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      {
        href: '/intelligence',
        label: 'Intelligence',
        icon: Brain,
        badge: 'AI',
        badgeColor: 'bg-violet-500/20 text-violet-400',
      },
    ],
  },
  {
    label: 'GESTIÓN',
    items: [
      { href: '/campaigns', label: 'Campañas', icon: Megaphone },
      {
        href: '/automations',
        label: 'Automatizaciones',
        icon: Zap,
        badge: 'NUEVO',
        badgeColor: 'bg-emerald-500/20 text-emerald-400',
      },
      { href: '/compare', label: 'Comparador', icon: GitCompare },
    ],
  },
  {
    label: 'SISTEMA',
    items: [{ href: '/settings', label: 'Configuración', icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [apiVersion, setApiVersion] = useState('v21.0');

  useEffect(() => {
    fetch('/api/meta/get-config')
      .then((r) => r.json())
      .then((d) => {
        setConnected(!!d.hasToken);
        if (d.apiVersion) setApiVersion(d.apiVersion);
      })
      .catch(() => setConnected(false));
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#07070f] border-r border-white/[0.05] z-40 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Meta Ads Pro</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 mb-1.5 text-[9px] font-bold text-white/20 tracking-widest uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, badge, badgeColor }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 group relative',
                      active
                        ? 'bg-violet-500/10 text-violet-400 border-l-2 border-violet-500'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03] border-l-2 border-transparent'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-3.5 h-3.5 shrink-0',
                        active ? 'text-violet-400' : 'text-white/30 group-hover:text-white/60'
                      )}
                    />
                    <span className="flex-1 font-medium">{label}</span>
                    {badge && (
                      <span
                        className={cn(
                          'ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                          badgeColor
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: connection status */}
      <div className="px-3 py-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              connected === null
                ? 'bg-white/20 animate-pulse'
                : connected
                ? 'bg-emerald-400 animate-pulse-glow'
                : 'bg-rose-500'
            )}
          />
          <div className="min-w-0">
            <p className="text-[11px] text-white/50 truncate">
              {connected === null ? 'Verificando…' : connected ? 'Conectado' : 'Sin conexión'}
            </p>
            <p className="text-[10px] text-white/20">Meta API {apiVersion}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
