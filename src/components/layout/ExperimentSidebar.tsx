import React from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Heading, Text } from "@/components/ui/Typography";

export interface ExperimentSidebarProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  variant?: "standard" | "glass";
  onClose?: () => void;
}

export function ExperimentSidebar({
  title,
  subtitle,
  children,
  variant = "standard",
  onClose,
}: ExperimentSidebarProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/math");
    }
  };

  const isGlass = variant === "glass";

  // Use a raw div instead of Card to avoid the "relative w-full" positioning override bugs.
  // The outer layout manages the strict `absolute right-4` positioning.
  return (
    <div
      className={`h-full flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${
        isGlass
          ? "bg-white/10 dark:bg-black/60 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-black dark:text-white"
          : "bg-[var(--bg-surface-elevated)] backdrop-blur-xl border border-[var(--border-main)] text-[var(--text-main)]"
      }`}
    >
      {/* ─── Header ─── */}
      <div
        className={`p-4 border-b shrink-0 flex justify-between items-center ${
          isGlass
            ? "border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/5"
            : "border-[var(--border-main)] bg-[var(--bg-surface-elevated)]"
        }`}
      >
        <div>
          <Text
            variant="label"
            className={`${
              isGlass ? "text-black/50 dark:text-white/50" : "text-[var(--text-muted)]"
            } !mb-1 text-[10px]`}
          >
            {subtitle}
          </Text>
          <Heading level={2} variant="card-subtitle" className="!mb-0 !text-xl">
            {title}
          </Heading>
        </div>
        <button
          onClick={handleClose}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            isGlass
              ? "text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10"
              : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Content Scrollable Area ─── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ scrollbarWidth: "none" }}>
        {children}
      </div>
    </div>
  );
}
