"use client";

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";

export default function RevalidatePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleRevalidate = async () => {
    setStatus("loading");
    setMessage("");
    try {
      // Calls the internal API route we created to trigger Next.js On-Demand Revalidation
      const res = await fetch("/api/revalidate", {
        method: "POST",
      });
      const data = await res.json();
      
      if (res.ok && data.revalidated) {
        setStatus("success");
        setMessage("Successfully revalidated blogs! The cache has been cleared and your latest posts will now be visible.");
      } else {
        throw new Error(data.message || "Failed to revalidate.");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred during revalidation.");
    }
  };

  return (
    <div className="relative container mx-auto px-6 md:px-12 py-12 md:py-24 z-10 flex-grow max-w-3xl">
      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">
          Cache Admin
        </h1>
        <p className="text-xl md:text-2xl text-gray-900 dark:text-gray-400 font-medium">
          Manually trigger a blog cache revalidation.
        </p>
      </div>

      <GlassCard className="p-8 md:p-12 relative overflow-hidden group">
        <h2 className="text-2xl font-black mb-4">Revalidate Blog Cache</h2>
        
        <p className="text-gray-800 dark:text-gray-300 font-medium mb-6 leading-relaxed">
          Your blog pages use Incremental Static Regeneration (ISR). By default, they naturally look for new posts every 1 hour in the background. 
        </p>
        <p className="text-gray-800 dark:text-gray-300 font-medium mb-8 leading-relaxed">
          If you just published a post on Dev.to and want it to appear <b>immediately</b> without waiting for the 1-hour background refresh or rebuilding your application, click the button below. This will trigger Next.js to purge the cached HTML and regenerate it.
        </p>

        <button
          onClick={handleRevalidate}
          disabled={status === "loading"}
          className="bg-black dark:bg-white text-white dark:text-black font-mono font-bold uppercase tracking-widest text-sm px-8 py-4 rounded-full transition-all disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
        >
          {status === "loading" ? "Revalidating..." : "Revalidate Now"}
        </button>

        {status === "success" && (
          <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-xl font-mono text-sm max-w-xl animate-in fade-in slide-in-from-bottom-2">
            ✅ {message}
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl font-mono text-sm max-w-xl animate-in fade-in slide-in-from-bottom-2">
            ❌ {message}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
