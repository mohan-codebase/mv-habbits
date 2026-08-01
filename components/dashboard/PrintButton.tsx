'use client';

import React from 'react';

export default function PrintButton() {
  return (
    <button
      className="no-print rounded-[12px] border-none bg-accent-primary px-[18px] py-2.5 text-[14px] font-bold text-accent-on-primary cursor-pointer"
      onClick={() => window.print()}
    >
      Save as PDF
    </button>
  );
}
