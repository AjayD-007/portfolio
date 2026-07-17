import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
}

export const Container = ({ children, className = "", maxWidth = "4xl", ...props }: ContainerProps) => {
  const maxWMap = {
    sm: "24rem",
    md: "28rem",
    lg: "32rem",
    xl: "36rem",
    "2xl": "42rem",
    "3xl": "48rem",
    "4xl": "56rem", // 896px
    "5xl": "64rem",
    "6xl": "72rem",
    "7xl": "80rem", // 1280px
    "full": "100%",
  };

  return (
    <div 
      className={`mega-container pt-4 md:pt-6 ${className}`} 
      style={{ '--container-max-w': maxWMap[maxWidth] } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
};
