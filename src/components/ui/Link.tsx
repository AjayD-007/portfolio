import React from "react";
import NextLink from "next/link";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: "nav" | "inline" | "button";
  buttonVariant?: "primary" | "secondary";
  children: React.ReactNode;
}

export const Link = ({ href, variant = "inline", buttonVariant = "primary", className = "", children, ...props }: LinkProps) => {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");

  const baseClasses = {
    nav: "inline-flex items-center gap-2 text-sm font-medium hover:scale-105 transition-all duration-300",
    inline: "text-amber-600 dark:text-amber-400 hover:underline transition-colors font-bold",
    button: "inline-flex items-center justify-center font-bold rounded-full transition-all duration-300 px-6 md:px-10 py-3 md:py-5 text-base md:text-lg",
  };

  const buttonStyles = {
    primary: "bg-[var(--text-main)] text-[var(--bg-surface)] hover:scale-105 shadow-xl",
    secondary: "bg-[var(--bg-surface-elevated)] border border-[var(--border-main)] backdrop-blur-md shadow-lg hover:bg-[var(--border-subtle)]",
  };

  const finalClass = `${baseClasses[variant]} ${variant === 'button' ? buttonStyles[buttonVariant] : ''} ${className}`;

  if (isExternal) {
    return (
      <a href={href} className={finalClass} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} className={finalClass} {...props}>
      {children}
    </NextLink>
  );
};
