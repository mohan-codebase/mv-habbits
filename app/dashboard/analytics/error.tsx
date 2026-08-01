'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Analytics error]', error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center gap-3.5 rounded-[16px] border border-border-subtle bg-bg-glass p-[48px_32px] text-center"
    >
      <p className="m-0 text-sm text-text-secondary">
        Failed to load analytics data.
      </p>
      <Button variant="secondary" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
