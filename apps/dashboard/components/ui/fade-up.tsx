"use client";

import { motion } from "framer-motion";

export const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <div className={className}>
    {children}
  </div>
);
