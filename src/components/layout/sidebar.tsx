'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  GitCompare,
  Settings,
  BarChart3,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campañas', icon: Megaphone },
  { href: '/compare', label: 'Comparador', icon: GitCompare },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0a0a0a] border-r border-white/[0.06] z-40 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Meta Ads Pro</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
                active
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-white' : 'text-white/40 group-hover:text-white/60')} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/60 truncate">Meta Marketing API</p>
            <p className="text-[10px] text-white/30">v21.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
