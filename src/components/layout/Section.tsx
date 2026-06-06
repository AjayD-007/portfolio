import React from "react";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  spacing?: "default" | "tight" | "none";
  layout?: "constrained" | "full" | "full-padded";
}

export const Section = ({ children, className = "", spacing = "default", layout = "constrained", ...props }: SectionProps) => {
  const spacingClasses = {
    default: "py-12 md:py-24", // Pure vertical rhythm padding
    tight: "py-6 md:py-12",
    none: "",
  };

  const layoutClasses = {
    "constrained": "", // Defaults to content column in Mega Container
    "full": "breakout",
    "full-padded": "breakout-padded",
  };

  return (
    <section className={`relative w-full flex flex-col ${spacingClasses[spacing]} ${layoutClasses[layout]} ${className}`} {...props}>
      {children}
    </section>
  );
};
