import React from "react";

export const Stack = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full">
      {children}
    </div>
  );
};
