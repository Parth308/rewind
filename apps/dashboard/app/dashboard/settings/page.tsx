import { Settings, Shield, Key, Bell, CreditCard, User, Mail, Save, Fingerprint } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-1">Settings</h1>
          <p className="text-sm text-neutral-400">Manage your account and platform preferences.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {[
            { name: 'General', icon: Settings, active: true },
            { name: 'Security', icon: Shield, active: false },
            { name: 'API Keys', icon: Key, active: false },
            { name: 'Notifications', icon: Bell, active: false },
            { name: 'Billing', icon: CreditCard, active: false },
          ].map((tab) => (
            <button
              key={tab.name}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                tab.active 
                  ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-white/10' 
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white border border-transparent'
              }`}
            >
              <tab.icon className={`h-4 w-4 ${tab.active ? 'text-[var(--color-accent-green)]' : 'text-neutral-500'}`} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 glass rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-[var(--color-accent-green)] opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="font-serif text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <User className="h-6 w-6 text-[var(--color-accent-green)]" />
            General Settings
          </h3>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-neutral-500" /> Display Name
              </label>
              <input 
                type="text" 
                defaultValue="Admin User"
                className="w-full sm:w-[28rem] glass bg-[#050505] border border-[var(--color-border-dark)] rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-green)] focus:ring-1 focus:ring-[var(--color-accent-green)]/50 focus:outline-none transition-all shadow-inner" 
              />
              <p className="text-xs text-neutral-500">This is your public display name within the team.</p>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-neutral-500" /> Email Address
              </label>
              <div className="relative w-full sm:w-[28rem]">
                <input 
                  type="email" 
                  defaultValue="admin@rewind.dev"
                  disabled
                  className="w-full glass bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-neutral-500 cursor-not-allowed shadow-inner" 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 items-center rounded bg-white/10 px-2 text-[10px] font-bold uppercase text-neutral-400">
                  Primary
                </div>
              </div>
              <p className="text-xs text-neutral-500">Contact support to change your primary email address.</p>
            </div>

            <div className="pt-6 border-t border-white/5">
              <button className="flex items-center gap-2 rounded-xl bg-[var(--color-accent-green)] px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-[var(--color-accent-green-hover)] shadow-lg shadow-[var(--color-accent-green)]/20">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
