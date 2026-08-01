'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Download, Upload, Database, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { exportUserData } from '@/lib/utils/export';
import { importUserData } from '@/lib/utils/import';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function DataManagement({ user }: { user: SupabaseUser | null }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    setError(null);
    setSuccess(null);
    try {
      await exportUserData(supabase, user.id);
      setSuccess('Data exported successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      await importUserData(supabase, user.id, file);
      setSuccess('Data imported successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to import data');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-border-subtle bg-bg-card py-4 px-[18px]">
      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-tertiary text-text-primary">
        <Database size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 mb-[3px] text-[14px] font-bold text-text-primary">
          Data Management
        </p>
        <p className="m-0 mb-3 text-sm leading-[1.5] text-text-muted">
          Export all your data for backup or import an existing backup. Importing will overwrite conflicting records.
        </p>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-sm bg-[rgba(239,68,68,0.1)] px-3 py-2 text-[12px] font-semibold text-[var(--danger)]">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-3 flex items-center gap-2 rounded-sm bg-[rgba(34,197,94,0.1)] px-3 py-2 text-[12px] font-semibold text-[#22c55e]">
            <Database size={14} />
            <span>{success}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExport}
            disabled={exporting || importing}
            className="flex items-center gap-1.5 rounded-sm border border-border-default bg-bg-tertiary px-3.5 py-[7px] text-[13px] font-semibold text-text-secondary [font-family:inherit] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={15} />
            {exporting ? 'Exporting...' : 'Export Data'}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={exporting || importing}
            className="flex items-center gap-1.5 rounded-sm border border-border-default bg-bg-tertiary px-3.5 py-[7px] text-[13px] font-semibold text-text-secondary [font-family:inherit] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={15} />
            {importing ? 'Importing...' : 'Import Data'}
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
