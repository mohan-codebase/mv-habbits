'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(140,140,140,0.24)] bg-[var(--danger-glow)] text-[22px]">
        <AlertTriangle size={22} color="var(--danger)" />
      </div>
      <h2 className="m-0 font-['Outfit',sans-serif] text-lg font-semibold text-text-primary">
        Something went wrong
      </h2>
      <p className="m-0 max-w-[360px] text-sm text-text-secondary">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
