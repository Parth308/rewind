"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export function PrivacySettingsTab({ initialSettings }: { initialSettings?: any }) {
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [settings, setSettings] = useState(() => {
    if (initialSettings) {
      return {
        maskInputs: initialSettings.maskInputs !== undefined ? initialSettings.maskInputs : true,
        maskSelectors: (initialSettings.maskSelectors || []).join(', '),
        blockSelectors: (initialSettings.blockSelectors || []).join(', '),
        ignoreUrls: (initialSettings.ignoreUrls || []).join(', '),
        captureNetworkBodies: initialSettings.captureNetworkBodies || false,
        networkBodyMaskKeys: (initialSettings.networkBodyMaskKeys || []).join(', '),
      };
    }
    return {
      maskInputs: true,
      maskSelectors: '',
      blockSelectors: '',
      ignoreUrls: '',
      captureNetworkBodies: false,
      networkBodyMaskKeys: '',
    };
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/settings/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maskInputs: settings.maskInputs,
          maskSelectors: settings.maskSelectors.split(',').map((s: string) => s.trim()).filter(Boolean),
          blockSelectors: settings.blockSelectors.split(',').map((s: string) => s.trim()).filter(Boolean),
          ignoreUrls: settings.ignoreUrls.split(',').map((s: string) => s.trim()).filter(Boolean),
          captureNetworkBodies: settings.captureNetworkBodies,
          networkBodyMaskKeys: settings.networkBodyMaskKeys.split(',').map((s: string) => s.trim()).filter(Boolean),
        }),
      });
      setSaveStatus(res.ok ? 'success' : 'error');
      if (res.ok) setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative z-10"
    >
      <div className="mb-10 pb-6 border-b border-[var(--color-border-dark)] flex items-center justify-between">
        <div>
          <h3 className="font-sans text-3xl font-bold text-white mb-2">Privacy & Masking</h3>
          <p className="text-neutral-500 font-mono text-xs">Configure how data is masked and blocked by the tracker.</p>
        </div>
        <Shield className="w-8 h-8 text-[var(--color-accent-green)]" />
      </div>

      <div className="space-y-10">
        
        {/* Toggle Mask Inputs */}
        <div className="p-6 border border-[var(--color-border-dark)] rounded-xl bg-white/[0.01] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white font-sans mb-1">Mask Input Fields</h4>
            <p className="text-xs font-mono text-neutral-500">
              Automatically replace text in input, textarea, and select elements with asterisks.
            </p>
          </div>
          <button
            onClick={() => setSettings((s: any) => ({ ...s, maskInputs: !s.maskInputs }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-green)] focus:ring-offset-2 focus:ring-offset-black ${
              settings.maskInputs ? 'bg-[var(--color-accent-green)]' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.maskInputs ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Textareas for Selectors */}
        <div className="space-y-6 p-6 border border-[var(--color-border-dark)] rounded-xl bg-white/[0.01]">
          <div className="space-y-3">
            <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase">
              Mask Selectors
            </label>
            <textarea
              value={settings.maskSelectors}
              onChange={e => setSettings({ ...settings, maskSelectors: e.target.value })}
              placeholder=".private-text, #user-balance"
              className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-xl px-4 py-4 text-white font-mono text-sm focus:border-[var(--color-accent-green)] focus:outline-none transition-all shadow-inner h-24 resize-none"
            />
            <p className="text-[11px] font-mono text-neutral-600">Comma-separated CSS selectors. Text inside these elements will be masked.</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase">
              Block Selectors
            </label>
            <textarea
              value={settings.blockSelectors}
              onChange={e => setSettings({ ...settings, blockSelectors: e.target.value })}
              placeholder=".sensitive-image, #checkout-iframe"
              className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-xl px-4 py-4 text-white font-mono text-sm focus:border-[var(--color-accent-green)] focus:outline-none transition-all shadow-inner h-24 resize-none"
            />
            <p className="text-[11px] font-mono text-neutral-600">Comma-separated CSS selectors. These elements and their children will be completely hidden from recordings.</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase">
              Ignore URLs
            </label>
            <textarea
              value={settings.ignoreUrls}
              onChange={e => setSettings({ ...settings, ignoreUrls: e.target.value })}
              placeholder="/checkout/*, /admin"
              className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-xl px-4 py-4 text-white font-mono text-sm focus:border-[var(--color-accent-green)] focus:outline-none transition-all shadow-inner h-24 resize-none"
            />
            <p className="text-[11px] font-mono text-neutral-600">Comma-separated URL patterns. Sessions will pause recording on these URLs.</p>
          </div>
        </div>

        {/* Network Payload Redaction */}
        <div className="space-y-6 p-6 border border-[var(--color-border-dark)] rounded-xl bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white font-sans mb-1">Capture API Payloads</h4>
              <p className="text-xs font-mono text-neutral-500">
                Record the request and response body payloads of API calls. Disabled by default for maximum privacy.
              </p>
            </div>
            <button
              onClick={() => setSettings((s: any) => ({ ...s, captureNetworkBodies: !s.captureNetworkBodies }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-green)] focus:ring-offset-2 focus:ring-offset-black ${
                settings.captureNetworkBodies ? 'bg-[var(--color-accent-green)]' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.captureNetworkBodies ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase">
              Redacted JSON Keys
            </label>
            <textarea
              value={settings.networkBodyMaskKeys}
              onChange={e => setSettings({ ...settings, networkBodyMaskKeys: e.target.value })}
              placeholder="password, token, secret, credit_card"
              disabled={!settings.captureNetworkBodies}
              className="w-full bg-[#111] border border-[var(--color-border-dark)] rounded-xl px-4 py-4 text-white font-mono text-sm focus:border-[var(--color-accent-green)] focus:outline-none transition-all shadow-inner h-24 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] font-mono text-neutral-600">Comma-separated keys. Any matching keys in JSON payloads will have their values replaced with [REDACTED].</p>
          </div>
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
              <CheckCircle2 className="w-4 h-4" /> Privacy settings saved
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
