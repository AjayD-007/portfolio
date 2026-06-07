"use client";

import React, { useEffect } from "react";

export interface ExperimentLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function ExperimentLayout({ children, sidebar }: ExperimentLayoutProps) {
  useEffect(() => {
    // Lock body scroll while in immersive mode
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-surface overflow-hidden text-[var(--text-main)] font-sans">
      {/* ─── Main Content Area (Fullscreen Visualization) ─── */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* ─── Sidebar Area ─── */}
      {sidebar && (
        <div className="absolute top-24 md:top-32 right-4 md:right-8 w-80 lg:w-96 max-h-[calc(100vh-8rem)] z-10 pointer-events-auto flex flex-col h-[80vh]">
          {sidebar}
        </div>
      )}
    </div>
  );
}
