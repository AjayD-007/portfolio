import React from "react";

export const Grid = ({ children, columns = 1 }: { children: React.ReactNode, columns?: 1 | 2 | 3 }) => {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };
  return (
    <div className={`grid ${colClasses[columns]} gap-4 md:gap-8 w-full`}>
      {children}
    </div>
  );
};
