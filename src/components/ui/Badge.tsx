import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "outline" | "solid";
}

export const Badge = ({ children, className = "", variant = "outline", ...props }: BadgeProps) => {
  const baseClasses = "inline-flex items-center justify-center px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-mono font-bold tracking-wide transition-colors";
  
  const variantClasses = {
    outline: "bg-[var(--border-subtle)] border border-[var(--border-main)] text-[var(--text-main)]",
    solid: "bg-[var(--text-main)] text-[var(--bg-surface)]",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
