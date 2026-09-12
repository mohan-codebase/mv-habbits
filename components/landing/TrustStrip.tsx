import React from 'react';
import { ShieldCheck, Download, Smartphone, Lock } from 'lucide-react';

const TRUST_POINTS = [
  {
    icon: Download,
    text: 'Your data is yours — export anytime',
  },
  {
    icon: Smartphone,
    text: 'Works on your phone as an installable PWA',
  },
  {
    icon: ShieldCheck,
    text: 'No ads, no data selling, zero tracking cookies',
  },
  {
    icon: Lock,
    text: 'Bank-grade RLS data isolation on Supabase',
  },
];

export default function TrustStrip() {
  return (
    <div className="border-b border-border-subtle bg-bg-tertiary/40 py-5 px-[clamp(16px,4vw,48px)]">
      <div className="mx-auto max-w-[1200px] flex flex-wrap items-center justify-around gap-y-4 gap-x-6 text-center">
        {TRUST_POINTS.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-text-secondary"
          >
            <Icon size={16} className="text-accent-primary shrink-0" aria-hidden="true" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
