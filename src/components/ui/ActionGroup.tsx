import React from "react";

export const ActionGroup = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center mt-4 w-full">
      {children}
    </div>
  );
};
