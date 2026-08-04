'use client';

import React from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { PwaProvider } from '@/components/ui/PwaContext';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PwaProvider>
          {children}
        </PwaProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

