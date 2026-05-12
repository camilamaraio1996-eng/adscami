'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionResult | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch('/api/meta/test-connection');
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Error de red al conectar con la API' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Configuración" subtitle="Conectá tu cuenta de Meta Ads" />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl space-y-6">
          {/* Security notice */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
            <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-400">Configuración segura</p>
              <p className="text-xs text-blue-400/60 mt-1">
                Las credenciales se leen desde variables de entorno del servidor. Configurá{' '}
                <code className="bg-white/10 px-1 rounded text-xs">META_ACCESS_TOKEN</code> y{' '}
                <code className="bg-white/10 px-1 rounded text-xs">META_AD_ACCOUNT_ID</code>{' '}
                en tu archivo <code className="bg-white/10 px-1 rounded text-xs">.env.local</code>.
                El token nunca se expone en el frontend.
              </p>
            </div>
          </div>

          {/* Env config guide */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <p className="text-sm font-medium text-white">Variables de entorno requeridas</p>

            <div className="rounded-lg bg-black/40 border border-white/[0.06] p-4 font-mono text-xs space-y-1">
              <p className="text-white/30"># .env.local</p>
              <p><span className="text-violet-400">META_ACCESS_TOKEN</span>=<span className="text-emerald-400">tu_token_aqui</span></p>
              <p><span className="text-violet-400">META_AD_ACCOUNT_ID</span>=<span className="text-emerald-400">act_XXXXXXXXXXXX</span></p>
              <p><span className="text-violet-400">META_API_VERSION</span>=<span className="text-emerald-400">v21.0</span></p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-white/70 mb-1">Cómo obtener tu Access Token</p>
                <ol className="text-xs text-white/40 space-y-1 list-decimal list-inside">
                  <li>Andá a <span className="text-white/60">developers.facebook.com</span></li>
                  <li>Creá o seleccioná tu app</li>
                  <li>Generá un User Access Token con permisos <code className="bg-white/10 px-1 rounded">ads_read</code> y <code className="bg-white/10 px-1 rounded">ads_management</code></li>
                  <li>Para producción, usá un token de larga duración (60 días) o un System User token</li>
                </ol>
              </div>
              <div>
                <p className="text-xs font-medium text-white/70 mb-1">Cómo obtener tu Ad Account ID</p>
                <ol className="text-xs text-white/40 space-y-1 list-decimal list-inside">
                  <li>Entrá al Administrador de Anuncios de Meta</li>
                  <li>En la URL verás un número como <code className="bg-white/10 px-1 rounded">act_1234567890</code></li>
                  <li>Ese es tu Ad Account ID</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Connection test */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <p className="text-sm font-medium text-white">Probar conexión</p>
            <p className="text-xs text-white/40">
              Verificá que las variables de entorno estén configuradas correctamente.
            </p>

            <Button
              onClick={testConnection}
              disabled={testing}
              className="h-9 text-xs bg-white text-black hover:bg-white/90"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Probar conexión'
              )}
            </Button>

            {result && (
              <div className={`rounded-xl border p-4 flex gap-3 ${result.success ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  {result.success ? (
                    <>
                      <p className="text-xs font-medium text-emerald-400">Conexión exitosa</p>
                      {result.account && (
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-xs text-emerald-400/60">Cuenta: <span className="text-emerald-400">{result.account.name}</span></p>
                          <p className="text-xs text-emerald-400/60">ID: <span className="text-emerald-400">{result.account.id}</span></p>
                          <p className="text-xs text-emerald-400/60">Moneda: <span className="text-emerald-400">{result.account.currency}</span></p>
                          <p className="text-xs text-emerald-400/60">Zona horaria: <span className="text-emerald-400">{result.account.timezone_name}</span></p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-rose-400">Error de conexión</p>
                      <p className="text-xs text-rose-400/60 mt-0.5">{result.error}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mock mode toggle */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
            <p className="text-sm font-medium text-white">Modo demo</p>
            <p className="text-xs text-white/40">
              Para activar datos de ejemplo sin API real, agregá a tu <code className="bg-white/10 px-1 rounded">.env.local</code>:
            </p>
            <div className="rounded-lg bg-black/40 border border-white/[0.06] p-3 font-mono text-xs">
              <p><span className="text-violet-400">NEXT_PUBLIC_USE_MOCK</span>=<span className="text-emerald-400">true</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
