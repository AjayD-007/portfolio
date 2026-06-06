import React from "react";

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export const SplitLayout = ({ left, right }: SplitLayoutProps) => {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between relative">
      <div className="w-full md:w-3/4 flex flex-col items-start justify-center pt-0 md:pt-16 h-full z-10">
        {left}
      </div>
      <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-2 md:mt-0 relative z-20">
        {right}
      </div>
    </div>
  );
};
