import { ClassValue, clsx } from "clsx";

export function cn(...inputs: (string | undefined | null | false | 0 | Record<string, boolean>)[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

export * from './api';
export * from './dates';
export * from './pdf';
export * from './url';
export * from './export';
export * from './import';
