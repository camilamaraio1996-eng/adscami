'use client';

import { useState } from 'react';
import {
  Zap,
  PauseCircle,
  TrendingUp,
  RefreshCw,
  ArrowLeftRight,
  FileText,
  ShieldOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Bell,
  RotateCcw,
  TrendingDown,
  ArrowUpRight,
  StopCircle,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  description: string;
  risk: 'high' | 'medium' | 'low';
  riskLabel: string;
  whatItDoes: string;
  risks: string;
}

interface SmartRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

type ActionState = 'idle' | 'confirming' | 'loading' | 'success' | 'error';

// ─── Data ──────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'pause_low_performance',
    icon: PauseCircle,
    iconColor: 'text-rose-400',
    title: 'Pausar anuncios de bajo rendimiento',
    description: 'Pausa automáticamente anuncios con CTR < 0.5% y gasto > $50',
    risk: 'high',
    riskLabel: 'Riesgo alto',
    whatItDoes:
      'Identificará todos los anuncios activos con CTR por debajo de 0.5% que hayan gastado más de $50 y los pausará. Esto detendrá el gasto en anuncios ineficientes.',
    risks:
      'Si los anuncios estaban en período de aprendizaje, pausarlos puede afectar la optimización del algoritmo. Revisá manualmente antes de confirmar.',
  },
  {
    id: 'scale_profitable',
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
    title: 'Escalar campañas rentables',
    description: 'Aumenta 20% el presupuesto de campañas con ROAS > 3x',
    risk: 'medium',
    riskLabel: 'Riesgo medio',
    whatItDoes:
      'Aumentará el presupuesto diario un 20% en todas las campañas con ROAS superior a 3x. El cambio se aplica desde hoy.',
    risks:
      'Un aumento mayor al 20% puede desestabilizar el algoritmo de Meta. Monitoreá el ROAS las primeras 48 horas después del cambio.',
  },
  {
    id: 'refresh_creatives',
    icon: RefreshCw,
    iconColor: 'text-blue-400',
    title: 'Renovar creatividades fatigadas',
    description: 'Identifica y reporta anuncios con frecuencia > 3',
    risk: 'low',
    riskLabel: 'Riesgo bajo',
    whatItDoes:
      'Generará un reporte completo de todos los anuncios con frecuencia superior a 3, incluyendo sugerencias de reemplazo y mejores prácticas de creatividades.',
    risks: 'Esta acción es de solo lectura — genera un reporte sin modificar campañas.',
  },
  {
    id: 'redistribute_budget',
    icon: ArrowLeftRight,
    iconColor: 'text-violet-400',
    title: 'Redistribuir presupuesto',
    description: 'Mueve presupuesto de peor a mejor campaña',
    risk: 'high',
    riskLabel: 'Riesgo alto',
    whatItDoes:
      'Reducirá en 20% el presupuesto de la campaña con peor rendimiento y aumentará en ese mismo monto la campaña con mejor ROAS.',
    risks:
      'La campaña con peor rendimiento puede estar en período de aprendizaje. Verificá que no tenga presupuesto comprometido antes de redistribuir.',
  },
  {
    id: 'create_report',
    icon: FileText,
    iconColor: 'text-amber-400',
    title: 'Crear informe de optimización',
    description: 'Genera PDF con análisis completo y recomendaciones',
    risk: 'low',
    riskLabel: 'Riesgo bajo',
    whatItDoes:
      'Creará un informe PDF completo con métricas del período, análisis de cada campaña, alertas identificadas y recomendaciones de optimización priorizadas.',
    risks: 'Sin riesgos — es una acción de solo lectura.',
  },
  {
    id: 'conservative_mode',
    icon: ShieldOff,
    iconColor: 'text-orange-400',
    title: 'Activar modo conservador',
    description: 'Reduce presupuesto 20% en todas las campañas activas',
    risk: 'high',
    riskLabel: 'Riesgo alto',
    whatItDoes:
      'Reducirá el presupuesto diario en un 20% para TODAS las campañas activas. Útil para controlar el gasto durante períodos de bajo rendimiento.',
    risks:
      'Puede afectar el aprendizaje del algoritmo y reducir el alcance. Puede tardar hasta 24 horas en reflejarse en el gasto.',
  },
];

const INITIAL_RULES: SmartRule[] = [
  {
    id: 'r1',
    name: 'Alerta de CTR bajo',
    condition: 'CTR < 1% con gasto > $20',
    action: 'Notificar: "Revisar creativo"',
    enabled: true,
    priority: 'high',
    category: 'Creativo',
    icon: Bell,
  },
  {
    id: 'r2',
    name: 'Rotación por frecuencia',
    condition: 'Frecuencia > 3',
    action: 'Sugerir rotar anuncio',
    enabled: true,
    priority: 'medium',
    category: 'Audiencia',
    icon: RotateCcw,
  },
  {
    id: 'r3',
    name: 'Reducir puja si CPC sube',
    condition: 'CPC aumenta > 40% vs semana anterior',
    action: 'Reducir puja 15%',
    enabled: false,
    priority: 'high',
    category: 'Puja',
    icon: TrendingDown,
  },
  {
    id: 'r4',
    name: 'Escalar ROAS alto',
    condition: 'ROAS > 3x durante 3 días',
    action: 'Sugerir escalar presupuesto',
    enabled: true,
    priority: 'high',
    category: 'Escala',
    icon: ArrowUpRight,
  },
  {
    id: 'r5',
    name: 'Pausar sin conversiones',
    condition: 'Sin conversiones en 3 días con gasto > $50',
    action: 'Pausar campaña',
    enabled: false,
    priority: 'high',
    category: 'Rendimiento',
    icon: StopCircle,
  },
  {
    id: 'r6',
    name: 'Revisar audiencia saturada',
    condition: 'CPM sube > 30% en 7 días',
    action: 'Alertar: "Revisar segmentación"',
    enabled: true,
    priority: 'medium',
    category: 'Audiencia',
    icon: Eye,
  },
  {
    id: 'r7',
    name: 'Auditar checkout',
    condition: 'Add to Cart alto, Purchase < 5%',
    action: 'Notificar: "Auditar flujo de pago"',
    enabled: true,
    priority: 'high',
    category: 'Embudo',
    icon: AlertTriangle,
  },
  {
    id: 'r8',
    name: 'Alerta de subgasto',
    condition: 'Gasto diario < 50% del presupuesto',
    action: 'Notificar: "Revisar entrega"',
    enabled: true,
    priority: 'medium',
    category: 'Presupuesto',
    icon: Bell,
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [rules, setRules] = useState<SmartRule[]>(INITIAL_RULES);
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});

  const riskColors = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const priorityColors = {
    high: 'bg-rose-500/20 text-rose-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-white/[0.06] text-white/40',
  };

  const getState = (id: string): ActionState => actionStates[id] || 'idle';

  const handleActionClick = (id: string) => {
    if (getState(id) === 'idle') {
      setExpandedAction(expandedAction === id ? null : id);
      setActionStates((prev) => ({ ...prev, [id]: 'confirming' }));
    }
  };

  const handleCancel = (id: string) => {
    setExpandedAction(null);
    setActionStates((prev) => ({ ...prev, [id]: 'idle' }));
  };

  const handleConfirm = async (id: string) => {
    setActionStates((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      const res = await fetch('/api/meta/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: id, entityId: null, entityType: 'bulk', params: {} }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setActionMessages((prev) => ({
          ...prev,
          [id]: data.error || 'Error al ejecutar la acción',
        }));
        setActionStates((prev) => ({ ...prev, [id]: 'error' }));
      } else {
        setActionMessages((prev) => ({
          ...prev,
          [id]: 'Acción ejecutada correctamente.',
        }));
        setActionStates((prev) => ({ ...prev, [id]: 'success' }));
      }
    } catch (err) {
      setActionMessages((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : 'Error de red',
      }));
      setActionStates((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleReset = (id: string) => {
    setActionStates((prev) => ({ ...prev, [id]: 'idle' }));
    setExpandedAction(null);
  };

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Automatizaciones" subtitle="Reglas inteligentes y acciones rápidas" />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Acciones Rápidas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const state = getState(action.id);
              const isExpanded = expandedAction === action.id;
              const ActionIcon = action.icon;

              return (
                <div
                  key={action.id}
                  className={cn(
                    'rounded-xl border transition-all duration-200',
                    state === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : state === 'error'
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : isExpanded
                      ? 'border-violet-500/30 bg-violet-500/5'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center">
                        <ActionIcon className={cn('w-4 h-4', action.iconColor)} />
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                          riskColors[action.risk]
                        )}
                      >
                        {action.riskLabel}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-white mb-1">{action.title}</p>
                    <p className="text-[11px] text-white/40 leading-relaxed mb-3">
                      {action.description}
                    </p>

                    {state === 'idle' && (
                      <button
                        onClick={() => handleActionClick(action.id)}
                        className="w-full py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[12px] text-white/70 hover:text-white transition-all font-medium"
                      >
                        Ejecutar
                      </button>
                    )}

                    {state === 'loading' && (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        <span className="text-[12px] text-white/50">Ejecutando…</span>
                      </div>
                    )}

                    {state === 'success' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[12px] font-medium">Ejecutado correctamente</span>
                        </div>
                        <p className="text-[11px] text-white/40">{actionMessages[action.id]}</p>
                        <button
                          onClick={() => handleReset(action.id)}
                          className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                        >
                          ← Volver
                        </button>
                      </div>
                    )}

                    {state === 'error' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-rose-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-[12px] font-medium">Error al ejecutar</span>
                        </div>
                        <p className="text-[11px] text-white/40">{actionMessages[action.id]}</p>
                        <button
                          onClick={() => handleReset(action.id)}
                          className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          Intentar de nuevo
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Panel */}
                  {state === 'confirming' && isExpanded && (
                    <div className="border-t border-white/[0.06] p-4 space-y-3">
                      <div>
                        <p className="text-[11px] text-white/30 mb-1 font-medium uppercase tracking-wider">
                          ¿Qué hará esto?
                        </p>
                        <p className="text-[12px] text-white/60 leading-relaxed">
                          {action.whatItDoes}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-rose-400/70 mb-1 font-medium uppercase tracking-wider">
                          Riesgos
                        </p>
                        <p className="text-[12px] text-white/50 leading-relaxed">{action.risks}</p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleCancel(action.id)}
                          className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[12px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleConfirm(action.id)}
                          className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[12px] text-white font-medium transition-colors"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart Rules */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Reglas Inteligentes</h2>
            <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
              {rules.filter((r) => r.enabled).length} activas
            </span>
          </div>

          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            {rules.map((rule, i) => {
              const RuleIcon = rule.icon;
              return (
                <div
                  key={rule.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 transition-colors',
                    i < rules.length - 1 && 'border-b border-white/[0.04]',
                    rule.enabled ? 'bg-white/[0.02] hover:bg-white/[0.04]' : 'bg-transparent opacity-50 hover:opacity-70'
                  )}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                    <RuleIcon className="w-3.5 h-3.5 text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-medium text-white">{rule.name}</p>
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                          priorityColors[rule.priority]
                        )}
                      >
                        {rule.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/30 truncate">
                      Si <span className="text-white/50">{rule.condition}</span> →{' '}
                      <span className="text-violet-400/70">{rule.action}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-white/20">{rule.category}</span>
                    {/* Toggle */}
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={cn(
                        'w-9 h-5 rounded-full transition-all duration-200 relative',
                        rule.enabled ? 'bg-violet-600' : 'bg-white/[0.1]'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                          rule.enabled ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
                        )}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
