"use client";

import { ReactNode, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  delay?: number; // Kept for backwards compatibility if passed
}

export const GlassCard = ({ children, className = "", delay = 0, ...props }: GlassCardProps) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-black/15 dark:border-white/10 bg-white/70 dark:bg-black/70 p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] dark:shadow-2xl ${className}`}
      {...props}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 pointer-events-none rounded-2xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
