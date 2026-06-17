"use client";

import { useActionState } from 'react';
import { loginUser } from '@/app/login/actions';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginUser, { error: '' });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full">
      <motion.div variants={itemVariants} className="mb-10">
        <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight">Access Secure Area</h2>
        <p className="text-neutral-500 text-sm font-mono tracking-wide">Enter your credentials to continue.</p>
      </motion.div>

      <form action={formAction} className="space-y-5">
        {state?.error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono text-center shadow-inner"
          >
            {state.error}
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="space-y-1">
          <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase ml-1">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-[var(--color-accent-green)] transition-colors" />
            <input
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-[var(--color-accent-green)]/50 focus:ring-1 focus:ring-[var(--color-accent-green)]/50 transition-all shadow-inner"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-1">
          <label className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase ml-1">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-[var(--color-accent-green)] transition-colors" />
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••••••"
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-[var(--color-accent-green)]/50 focus:ring-1 focus:ring-[var(--color-accent-green)]/50 transition-all shadow-inner"
            />
          </div>
        </motion.div>

        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isPending}
          className="group relative w-full mt-4 bg-[var(--color-accent-green)] text-black font-semibold py-4 rounded-xl hover:bg-[#a6fc4c] transition-colors disabled:opacity-50 overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isPending ? 'Authenticating...' : 'Secure Login'}
            {!isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </span>
          <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
        </motion.button>
      </form>
    </motion.div>
  );
}
