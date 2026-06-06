import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "nav";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
}

export const Button = ({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) => {
  const baseClass = "inline-flex items-center justify-center font-bold rounded-full transition-all duration-300";
  
  const variantClasses = {
    primary: "bg-[var(--text-main)] text-[var(--bg-surface)] hover:scale-105 shadow-xl",
    secondary: "bg-[var(--bg-surface-elevated)] border border-[var(--border-main)] backdrop-blur-md shadow-lg hover:bg-[var(--border-subtle)]",
    ghost: "hover:bg-[var(--border-subtle)]",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-glow-red",
    nav: "bg-black/5 dark:bg-white/10 backdrop-blur-md border border-[var(--border-subtle)]",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base md:text-lg md:px-10 md:py-5",
    lg: "px-8 py-4 text-lg md:text-2xl md:px-12 md:py-6",
    icon: "p-2",
  };

  return (
    <button className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};
