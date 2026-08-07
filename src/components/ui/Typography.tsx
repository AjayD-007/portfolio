import React from "react";

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: "hero" | "section" | "card" | "card-interactive" | "card-subtitle" | "section-card";
  children: React.ReactNode;
}

export const Heading = ({ level = 2, variant = "card", className = "", children, ...props }: HeadingProps) => {
  const Tag = `h${level}` as any;
  const variantClasses = {
    "hero": "text-5xl sm:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black tracking-tighter uppercase leading-none drop-shadow-md mb-4 text-center md:text-left w-full",
    "section": "text-4xl md:text-6xl font-black drop-shadow-sm mb-4 md:mb-8 text-center md:text-left w-full",
    "section-card": "text-4xl md:text-6xl font-black drop-shadow-sm mb-4 md:mb-8 text-center w-full",
    "card": "text-2xl md:text-3xl font-bold mb-3 md:mb-4",
    "card-interactive": "text-2xl md:text-3xl font-bold mb-3 md:mb-4",
    "card-subtitle": "text-xl md:text-2xl font-bold",
  };

  return (
    <Tag className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export const GradientText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <span className={`text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500 break-words ${className}`}>
      {children}
    </span>
  );
};

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "body" | "muted" | "hero-subtitle" | "card-subtitle" | "label";
  children: React.ReactNode;
}

export const Text = ({ variant = "body", className = "", children, ...props }: TextProps) => {
  const variantClasses = {
    "body": "text-lg md:text-2xl font-medium leading-relaxed",
    "muted": "text-base md:text-lg text-[var(--text-muted)] font-medium leading-relaxed",
    "card-subtitle": "text-base md:text-lg text-[var(--text-muted)] font-medium leading-relaxed mt-1 md:mt-2",
    "hero-subtitle": "text-lg md:text-xl lg:text-2xl text-[var(--text-muted)] font-semibold capitalize text-center md:text-left w-full",
    "label": "text-[10px] sm:text-xs md:text-sm font-mono font-bold tracking-widest uppercase",
  };

  return (
    <p className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </p>
  );
};
