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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 16,
        padding: '32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--danger-glow)',
          border: '1px solid rgba(140, 140, 140,0.24)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
        }}
      >
        <AlertTriangle size={22} color="var(--danger)" />
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        Something went wrong
      </h2>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360 }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
