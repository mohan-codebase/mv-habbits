'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      className="w-[34px] h-[34px] flex items-center justify-center rounded-[9px] border border-border-default bg-bg-tertiary text-text-secondary cursor-pointer transition-[background,color,transform] duration-150 hover:bg-bg-elevated hover:text-text-primary"
    >
      {isLight ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}
