"use client";

import { resumeData } from "@/data/resume";

export function Footer() {
  return (
    <footer className="w-full text-center py-8 text-sm text-gray-800 dark:text-gray-400 font-mono tracking-widest font-bold z-20 relative pointer-events-auto mt-auto">
      &copy; {new Date().getFullYear()} {resumeData.title.toUpperCase()}
    </footer>
  );
}
