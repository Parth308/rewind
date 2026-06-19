"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, RefreshCw, Cpu } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  supportsEmbedding: boolean;
  supportsGeneration: boolean;
  contextWindow?: number;
}

type Provider = 'google' | 'openai' | 'anthropic';

const PROVIDERS: { id: Provider; label: string; description: string; keyPlaceholder: string; keyPrefix: string }[] = [
  {
    id: 'google',
    label: 'Google Gemini',
    description: 'Fast, multimodal, generous free tier.',
    keyPlaceholder: 'AIza...',
    keyPrefix: 'AIza',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'Industry standard GPT-4o models.',
    keyPlaceholder: 'sk-...',
    keyPrefix: 'sk-',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'Advanced reasoning with Claude.',
    keyPlaceholder: 'sk-ant-...',
    keyPrefix: 'sk-ant',
  },
];

function formatContext(tokens?: number) {
  if (!tokens) return null;
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M ctx`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K ctx`;
  return `${tokens} ctx`;
}

export function ApiSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  const [settings, setSettings] = useState({
    provider: 'google' as Provider,
    googleApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    languageModel: '',
    embeddingModel: '',
    scope: 'project',
  });

  const [envStatus, setEnvStatus] = useState({
    hasGoogleKey: false,
    hasOpenAiKey: false,
    hasAnthropicKey: false,
  });

  // Load initial settings
  useEffect(() => {
    fetch('/api/settings/ai')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSettings(prev => ({ ...prev, ...data.settings, scope: 'project' }));
          setEnvStatus(data.env);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Derive the effective API key for the active provider
  const effectiveKey = useCallback((provider: Provider): string => {
    if (provider === 'google') return settings.googleApiKey || (envStatus.hasGoogleKey ? '__env__' : '');
    if (provider === 'openai') return settings.openaiApiKey || (envStatus.hasOpenAiKey ? '__env__' : '');
    if (provider === 'anthropic') return settings.anthropicApiKey || (envStatus.hasAnthropicKey ? '__env__' : '');
    return '';
  }, [settings, envStatus]);

  const fetchModels = useCallback(async (provider: Provider, explicitKey?: string) => {
    const key = explicitKey || effectiveKey(provider);
    if (!key) return;

    setFetchingModels(true);
    setModelsError(null);
    setAvailableModels([]);

    try {
      const res = await fetch(`/api/settings/ai/models?provider=${provider}&apiKey=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success) {
        setAvailableModels(data.models);
        // Auto-select sensible defaults if current selection is not in the list
        const genModels = data.models.filter((m: ModelInfo) => m.supportsGeneration);
        const embModels = data.models.filter((m: ModelInfo) => m.supportsEmbedding);
        setSettings(prev => ({
          ...prev,
          languageModel: genModels.find((m: ModelInfo) => m.id === prev.languageModel) ? prev.languageModel : genModels[0]?.id || '',
          embeddingModel: embModels.find((m: ModelInfo) => m.id === prev.embeddingModel) ? prev.embeddingModel : embModels[0]?.id || '',
        }));
      } else {
        setModelsError(data.error || 'Failed to fetch models');
      }
    } catch (err: any) {
      setModelsError(err.message || 'Network error');
    } finally {
      setFetchingModels(false);
    }
  }, [effectiveKey]);

  // Fetch models when provider or keys change (only if we have a key)
  useEffect(() => {
    if (!loading) {
      fetchModels(settings.provider);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.provider, loading]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaveStatus(res.ok ? 'success' : 'error');
      if (res.ok) setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (key: string) => setShowKey(prev => ({ ...prev, [key]: !prev[key] }));

  const currentProvider = PROVIDERS.find(p => p.id === settings.provider)!;
  const genModels = availableModels.filter(m => m.supportsGeneration);
  const embModels = availableModels.filter(m => m.supportsEmbedding);
  const hasKey = !!effectiveKey(settings.provider) && effectiveKey(settings.provider) !== '';
  const keyInEnv = { google: envStatus.hasGoogleKey, openai: envStatus.hasOpenAiKey, anthropic: envStatus.hasAnthropicKey };

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-6">
        <div className="h-8 w-48 bg-white/5 rounded" />
        <div className="h-20 w-full bg-white/5 rounded" />
        <div className="h-20 w-full bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative z-10"
    >
      <div className="flex justify-between items-end mb-10 pb-6 border-b border-[var(--color-border-dark)]">
        <h3 className="font-sans text-3xl font-bold text-white">AI & API Settings</h3>
        <select
          value={settings.scope}
          onChange={e => setSettings({ ...settings, scope: e.target.value })}
          className="bg-[#111] border border-[var(--color-border-dark)] rounded-lg px-3 py-1.5 text-xs font-mono text-neutral-400 focus:outline-none focus:border-[var(--color-accent-green)] transition-all"
        >
          <option value="project">Project Level</option>
          <option value="global">Global (All Projects)</option>
        </select>
      </div>

      <div className="space-y-10">
        {/* Provider Toggle */}
        <div className="space-y-4">
          <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase">Active Provider</label>
          <div className="flex gap-3">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => setSettings({ ...settings, provider: p.id, languageModel: '', embeddingModel: '' })}
                className={`flex-1 p-4 rounded-xl border flex flex-col items-start gap-1.5 transition-all ${
                  settings.provider === p.id
                    ? 'border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/5'
                    : 'border-[var(--color-border-dark)] bg-white/5 hover:border-neutral-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all ${settings.provider === p.id ? 'bg-[var(--color-accent-green)] shadow-[0_0_8px_rgba(163,230,53,0.6)]' : 'bg-neutral-700'}`} />
                  <span className="font-sans font-bold text-base text-white">{p.label}</span>
                </div>
                <p className="text-[11px] font-mono text-neutral-500 text-left">{p.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* API Key Input */}
        <div className="p-6 border border-[var(--color-border-dark)] rounded-xl bg-white/[0.01] space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase flex justify-between items-center">
              <span>{currentProvider.label} API Key</span>
              {keyInEnv[settings.provider] && !(settings[`${settings.provider}ApiKey` as keyof typeof settings]) && (
                <span className="flex items-center gap-1.5 text-[var(--color-accent-green)]">
                  <CheckCircle2 className="w-3 h-3" /> Detected from .env
                </span>
              )}
            </label>
            <div className="relative w-full">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 w-4 h-4 pointer-events-none" />
              <input
                type={showKey[settings.provider] ? 'text' : 'password'}
                value={(settings[`${settings.provider}ApiKey` as keyof typeof settings] as string) || ''}
                onChange={e => {
                  const key = `${settings.provider}ApiKey` as keyof typeof settings;
                  setSettings({ ...settings, [key]: e.target.value });
                }}
                onBlur={e => {
                  if (e.target.value.length > 10) fetchModels(settings.provider, e.target.value);
                }}
                placeholder={keyInEnv[settings.provider] ? '•••••••••••••••• (from .env — override below)' : currentProvider.keyPlaceholder}
                className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-xl pl-12 pr-24 py-4 text-white font-mono text-sm focus:border-[var(--color-accent-green)] focus:ring-1 focus:ring-[var(--color-accent-green)]/30 focus:outline-none transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => fetchModels(settings.provider)}
                  disabled={fetchingModels || !hasKey}
                  title="Refresh model list"
                  className="text-neutral-500 hover:text-white transition-colors disabled:opacity-30"
                >
                  <RefreshCw className={`w-4 h-4 ${fetchingModels ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => toggleShowKey(settings.provider)} className="text-neutral-500 hover:text-white transition-colors">
                  {showKey[settings.provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] font-mono text-neutral-600">
              Key is never sent to the browser — queries via a Next.js server route.
            </p>
          </div>

          {/* Model Selectors */}
          {fetchingModels ? (
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 animate-pulse py-4">
              <Cpu className="w-4 h-4" />
              Fetching live model list from {currentProvider.label}...
            </div>
          ) : modelsError ? (
            <div className="flex items-start gap-2 text-xs font-mono text-red-400 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{modelsError}</span>
            </div>
          ) : availableModels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language Model */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase">Language Model</label>
                {genModels.length > 0 ? (
                  <select
                    value={settings.languageModel}
                    onChange={e => setSettings({ ...settings, languageModel: e.target.value })}
                    className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[var(--color-accent-green)] transition-all"
                  >
                    {genModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.contextWindow ? ` — ${formatContext(m.contextWindow)}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs font-mono text-neutral-600 py-2">No generation models available</p>
                )}
              </div>

              {/* Embedding Model */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase">Embedding Model</label>
                {embModels.length > 0 ? (
                  <select
                    value={settings.embeddingModel}
                    onChange={e => setSettings({ ...settings, embeddingModel: e.target.value })}
                    className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[var(--color-accent-green)] transition-all"
                  >
                    {embModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.contextWindow ? ` — ${formatContext(m.contextWindow)}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-neutral-600 py-2">
                      {settings.provider === 'anthropic'
                        ? 'Anthropic does not provide embeddings. Will use Google Gemini as fallback.'
                        : 'No embedding models available for this key.'}
                    </p>
                    {settings.provider === 'anthropic' && (
                      <input
                        type="text"
                        value={settings.embeddingModel}
                        onChange={e => setSettings({ ...settings, embeddingModel: e.target.value })}
                        placeholder="gemini-embedding-001"
                        className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[var(--color-accent-green)] transition-all"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Model count info */}
              <div className="col-span-2 flex items-center gap-2 text-[10px] font-mono text-neutral-600">
                <Cpu className="w-3 h-3" />
                {availableModels.length} models available for this key · {genModels.length} generation · {embModels.length} embedding
              </div>
            </div>
          ) : !hasKey ? (
            <p className="text-xs font-mono text-neutral-600 py-2">
              Enter an API key to load the available models for your account.
            </p>
          ) : null}
        </div>

        <div className="pt-6 border-t border-[var(--color-border-dark)] flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 rounded-xl bg-[var(--color-accent-green)] px-8 py-4 text-sm font-mono font-bold text-black transition-all hover:bg-[var(--color-accent-green-hover)] shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
            COMMIT CHANGES
          </button>

          {saveStatus === 'success' && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-[var(--color-accent-green)] font-mono text-xs">
              <CheckCircle2 className="w-4 h-4" /> Settings saved successfully
            </motion.div>
          )}
          {saveStatus === 'error' && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-red-400 font-mono text-xs">
              <AlertCircle className="w-4 h-4" /> Error saving settings
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
