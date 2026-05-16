'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Key,
  Link2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConfigStatus {
  hasToken: boolean;
  accountId: string;
  apiVersion: string;
  source: 'env' | 'cookie' | 'none';
}

interface ConnectionResult {
  success: boolean;
  account?: { name: string; id: string; currency: string; timezone_name: string };
  error?: string;
}

export default function SettingsPage() {
  const [token, setToken] = useState('');
  const [accountId, setAccountId] = useState('');
  const [apiVersion, setApiVersion] = useState('v21.0');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    loadConfigStatus();
  }, []);

  async function loadConfigStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/meta/get-config');
      const data = await res.json();
      setConfigStatus(data);
      if (data.accountId) setAccountId(data.accountId);
      if (data.apiVersion) setApiVersion(data.apiVersion);
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false);
    }
  }

  async function saveAndTest() {
    if (!token && !configStatus?.hasToken) {
      setResult({ success: false, error: 'Ingresá tu Access Token para continuar.' });
      return;
    }
    if (!accountId) {
      setResult({ success: false, error: 'Ingresá tu Ad Account ID.' });
      return;
    }

    setSaving(true);
    setResult(null);

    try {
      if (token || accountId) {
        const saveRes = await fetch('/api/meta/save-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token || undefined, accountId, apiVersion }),
        });
        if (!saveRes.ok) throw new Error('No se pudo guardar la configuración.');
      }

      setTesting(true);
      const testRes = await fetch('/api/meta/test-connection');
      const testData = await testRes.json();
      setResult(testData);

      if (testData.success) {
        setToken('');
        await loadConfigStatus();
      }
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : 'Error desconocido' });
    } finally {
      setSaving(false);
      setTesting(false);
    }
  }

  async function clearConfig() {
    try {
      await fetch('/api/meta/save-config', { method: 'DELETE' });
      setToken('');
      setAccountId('');
      setApiVersion('v21.0');
      setResult(null);
      await loadConfigStatus();
    } catch {
      // ignore
    }
  }

  const isBusy = saving || testing;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Configuración" subtitle="Conectá tu cuenta de Meta Ads" />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl space-y-5">

          {/* Current status */}
          {!loadingStatus && (
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${
              configStatus?.hasToken
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-amber-500/20 bg-amber-500/5'
            }`}>
              {configStatus?.hasToken ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${configStatus?.hasToken ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {configStatus?.hasToken ? 'Token configurado' : 'Sin token — configurá tus credenciales'}
                </p>
                {configStatus?.hasToken && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-white/40">
                      Fuente: <span className="text-white/60">{configStatus.source === 'env' ? 'Variable de entorno' : 'Guardado en sesión'}</span>
                    </p>
                    {configStatus.accountId && (
                      <p className="text-xs text-white/40">
                        Ad Account: <span className="text-white/60">{configStatus.accountId}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
              {configStatus?.source === 'cookie' && (
                <button
                  onClick={clearConfig}
                  className="text-white/30 hover:text-rose-400 transition-colors"
                  title="Limpiar credenciales"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Credential form */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-white/40" />
              <p className="text-sm font-medium text-white">Credenciales de Meta</p>
            </div>

            {/* Token */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">
                Access Token
                {configStatus?.hasToken && !token && (
                  <span className="ml-2 text-emerald-400/60">(ya configurado — pegá uno nuevo para reemplazarlo)</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={configStatus?.hasToken ? '••••••••••••••••••••' : 'EAANjq...'}
                  className="pr-10 font-mono text-xs h-9 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-white/30">
                Generá uno en{' '}
                <a
                  href="https://developers.facebook.com/tools/explorer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5"
                >
                  Graph API Explorer <ExternalLink className="w-2.5 h-2.5" />
                </a>
                {' '}con permisos{' '}
                <code className="bg-white/10 px-1 rounded">ads_read</code> y{' '}
                <code className="bg-white/10 px-1 rounded">ads_management</code>
              </p>
            </div>

            {/* Account ID */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Ad Account ID</Label>
              <Input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="act_1234567890"
                className="font-mono text-xs h-9 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20"
              />
              <p className="text-[11px] text-white/30">
                Lo encontrás en la URL del Administrador de Anuncios (ej: act_1323749182974861)
              </p>
            </div>

            {/* API Version */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Versión de la API</Label>
              <Input
                type="text"
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
                placeholder="v21.0"
                className="font-mono text-xs h-9 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20"
              />
            </div>

            {/* Save button */}
            <Button
              onClick={saveAndTest}
              disabled={isBusy}
              className="w-full h-9 text-xs bg-white text-black hover:bg-white/90 disabled:opacity-50"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  {saving && !testing ? 'Guardando...' : 'Verificando conexión...'}
                </>
              ) : (
                'Guardar y verificar conexión'
              )}
            </Button>

            {/* Connection result */}
            {result && (
              <div className={`rounded-xl border p-4 flex gap-3 ${
                result.success
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-rose-500/20 bg-rose-500/5'
              }`}>
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  {result.success ? (
                    <>
                      <p className="text-xs font-medium text-emerald-400">¡Conexión exitosa!</p>
                      {result.account && (
                        <div className="mt-2 space-y-0.5">
                          <p className="text-xs text-emerald-400/70">
                            Cuenta: <span className="text-emerald-400 font-medium">{result.account.name}</span>
                          </p>
                          <p className="text-xs text-emerald-400/70">
                            ID: <span className="text-emerald-400">{result.account.id}</span>
                          </p>
                          <p className="text-xs text-emerald-400/70">
                            Moneda: <span className="text-emerald-400">{result.account.currency}</span>
                          </p>
                          <p className="text-xs text-emerald-400/70">
                            Zona horaria: <span className="text-emerald-400">{result.account.timezone_name}</span>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-rose-400">Error de conexión</p>
                      <p className="text-xs text-rose-400/60 mt-0.5">{result.error}</p>
                      {result.error?.includes('vencido') || result.error?.includes('inválido') ? (
                        <p className="text-xs text-rose-400/40 mt-1">
                          Los tokens de corta duración vencen en 1–2 hs. Generá uno nuevo en Graph API Explorer.
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Security notice */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex gap-3">
            <Shield className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-white/50">Seguridad</p>
              <p className="text-xs text-white/30 mt-1">
                El token se guarda en una cookie httpOnly del servidor y nunca se expone en el frontend.
                Todas las llamadas a Meta API son server-side. Para producción usá un token de larga
                duración (60 días) o un System User Token.
              </p>
            </div>
          </div>

          {/* How to get long-lived token */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
            <p className="text-xs font-medium text-white/60">Cómo obtener un token de larga duración</p>
            <ol className="text-xs text-white/40 space-y-1.5 list-decimal list-inside">
              <li>
                Andá a{' '}
                <a
                  href="https://developers.facebook.com/tools/explorer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Graph API Explorer
                </a>
              </li>
              <li>
                Seleccioná tu app y hacé click en <span className="text-white/60">Generate Access Token</span>
              </li>
              <li>
                Activá los permisos{' '}
                <code className="bg-white/10 px-1 rounded">ads_read</code> y{' '}
                <code className="bg-white/10 px-1 rounded">ads_management</code>
              </li>
              <li>
                Para extender a 60 días: usá la herramienta de{' '}
                <a
                  href="https://developers.facebook.com/tools/access-token"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Access Token Debugger
                </a>{' '}
                → Exchange for long-lived token
              </li>
              <li>Para no-expirar: creá un System User en Business Manager</li>
            </ol>
          </div>

        </div>
      </div>
    </div>
  );
}
