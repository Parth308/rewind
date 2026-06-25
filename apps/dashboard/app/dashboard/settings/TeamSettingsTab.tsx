"use client";

import { useState, useActionState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Trash2, Mail, CheckCircle2, UserPlus, X, Copy, AlertCircle } from 'lucide-react';
import { createInvite, deleteInvite, removeUser } from './actions';

export function TeamSettingsTab({ 
  users, 
  invites,
  currentUserRole,
  isDemoMode
}: { 
  users: any[], 
  invites: any[],
  currentUserRole: string,
  isDemoMode?: boolean
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createInvite, {} as any);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [demoError, setDemoError] = useState(false);

  const handleCopy = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative z-10"
    >
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-[var(--color-border-dark)]">
        <h3 className="font-sans text-3xl font-bold text-white">Team & Roles</h3>
        
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--color-accent-green)] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#a6fc4c] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      <AnimatePresence>
        {demoError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>Action disabled in Demo Mode</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-10">
        
        {/* Active Members */}
        <div>
          <h4 className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase mb-4">Active Members</h4>
          <div className="bg-[#111] border border-[var(--color-border-dark)] rounded-2xl overflow-hidden">
            {users.map((user, i) => (
              <div key={user.id} className={`flex items-center justify-between p-4 ${i !== users.length - 1 ? 'border-b border-[var(--color-border-dark)]' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white font-sans border border-white/10">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{user.name || 'Pending Name'}</div>
                    <div className="text-neutral-500 text-xs">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 capitalize">
                    {user.role}
                  </div>
                  {currentUserRole === 'owner' && user.role !== 'owner' && (
                    <button 
                      onClick={() => {
                        if (isDemoMode) {
                          setDemoError(true);
                          setTimeout(() => setDemoError(false), 3000);
                        } else {
                          removeUser(user.id);
                        }
                      }}
                      className="text-neutral-600 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div>
            <h4 className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase mb-4">Pending Invites</h4>
            <div className="bg-[#111] border border-[var(--color-border-dark)] rounded-2xl overflow-hidden">
              {invites.map((invite, i) => (
                <div key={invite.id} className={`flex items-center justify-between p-4 ${i !== invites.length - 1 ? 'border-b border-[var(--color-border-dark)]' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-accent-green)]/10 flex items-center justify-center text-[var(--color-accent-green)]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{invite.email}</div>
                      <div className="text-neutral-500 text-xs">Invited as {invite.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleCopy(invite.token)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white transition-colors border border-white/10"
                    >
                      {copiedToken === invite.token ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copiedToken === invite.token ? 'Copied' : 'Copy Link'}
                    </button>
                    {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                      <button 
                        onClick={() => {
                          if (isDemoMode) {
                            setDemoError(true);
                            setTimeout(() => setDemoError(false), 3000);
                          } else {
                            deleteInvite(invite.id);
                          }
                        }}
                        className="text-neutral-600 hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <div className="w-12 h-12 bg-[var(--color-accent-green)]/10 rounded-xl flex items-center justify-center mb-4 text-[var(--color-accent-green)]">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-sans font-bold text-white mb-2">Invite Member</h2>
                <p className="text-neutral-500 text-sm">Send a secure invite link to a new team member.</p>
              </div>

              {state?.success ? (
                <div className="space-y-6">
                  <div className="p-4 bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 rounded-xl">
                    <p className="text-sm text-[var(--color-accent-green)] mb-3">Invite generated successfully! Copy the link below and send it to them.</p>
                    <div className="flex items-center gap-2">
                      <input 
                        readOnly 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${state.token}`}
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono"
                      />
                      <button 
                        onClick={() => handleCopy(state.token!)}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                      >
                        {copiedToken === state.token ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsModalOpen(false); state.success = false; }}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form action={formAction} className="space-y-4">
                  {state?.error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                      {state.error}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-mono tracking-widest text-neutral-500 uppercase mb-2">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="colleague@company.com"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[var(--color-accent-green)]/50 focus:ring-1 focus:ring-[var(--color-accent-green)]/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono tracking-widest text-neutral-500 uppercase mb-2">Role</label>
                    <select 
                      name="role"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-accent-green)]/50 focus:ring-1 focus:ring-[var(--color-accent-green)]/50 transition-all appearance-none"
                    >
                      <option value="viewer">Viewer (Read-only)</option>
                      {currentUserRole === 'owner' && <option value="admin">Admin (Manage projects)</option>}
                    </select>
                  </div>

                  <button 
                    type="submit"
                    disabled={isPending}
                    className="w-full mt-6 bg-[var(--color-accent-green)] text-black font-semibold py-3 rounded-xl hover:bg-[#a6fc4c] transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Generating Link...' : 'Generate Invite Link'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
