import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  variant?: "default" | "interactive" | "cta" | "nav";
}

export const Card = ({ children, className = "", delay = 0, variant = "default", ...props }: CardProps) => {
  const baseClasses = "relative overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface-elevated)] backdrop-blur-2xl shadow-glass transition-all duration-700 w-full";
  
  const variantClasses = {
    "default": "p-4 md:p-6 lg:p-8",
    "interactive": "p-4 md:p-6 lg:p-8 group hover:border-[var(--text-muted)] cursor-pointer", // Adds interaction hints
    "cta": "py-10 md:py-16 px-5 md:px-10 text-center w-full flex flex-col items-center justify-center",
    "nav": "p-3 md:p-4 w-full flex items-center justify-between",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {/* Professional radial gradient / subtle mesh glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--text-main)]/5 via-transparent to-transparent pointer-events-none rounded-2xl mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--glow-inner)] to-transparent pointer-events-none rounded-2xl" />
      {/* Content wrapper */}
      <div className={`relative z-10 flex h-full w-full ${variant=="nav"?"":"flex-col"}`}>
        {children}
      </div>
    </div>
  );
};
