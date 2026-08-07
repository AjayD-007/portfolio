"use client";

import { useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";

export function ResumeButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'rate-limited'>('idle');

  const handleDownload = async () => {
    if (status === 'loading' || status === 'rate-limited') return;

    setStatus('loading');

    try {
      const response = await fetch('/api/download-resume');
      
      if (response.status === 429) {
        setStatus('rate-limited');
        setTimeout(() => setStatus('idle'), 5000); // Reset after 5s
        return;
      }

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Ajay_Dharmaraj_Resume.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setStatus('idle');
    } catch (error) {
      console.error('Download error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={status === 'loading' || status === 'rate-limited'}
      className={`text-sm md:text-base font-semibold text-[var(--text-main)] underline underline-offset-4 decoration-[var(--text-muted)] hover:decoration-[var(--text-main)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        (status === 'rate-limited' || status === 'error') ? 'line-through text-[var(--text-muted)]' : ''
      }`}
      title="Download Resume"
    >
      {status === 'loading' ? (
        <span>Loading...</span>
      ) : status === 'rate-limited' ? (
        <span>Limit Reached</span>
      ) : status === 'error' ? (
        <span>Error</span>
      ) : (
        <span>Resume</span>
      )}
    </button>
  );
}
