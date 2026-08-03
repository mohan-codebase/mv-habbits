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
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-bg-tertiary/40">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-tertiary text-text-primary">
          <Database size={18} />
        </div>
        <div className="min-w-0">
          <p className="m-0 text-sm font-bold text-text-primary">Data Backups & Export</p>
          <p className="m-0 text-xs text-text-muted">Export your habit history or restore a JSON backup.</p>

          {error && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <Database size={14} />
              <span>{success}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
        <button
          onClick={handleExport}
          disabled={exporting || importing}
          className="flex items-center gap-1.5 rounded-full border border-border-default bg-bg-tertiary px-4 py-1.5 text-xs font-semibold text-text-primary transition-all hover:border-accent-primary hover:text-accent-primary cursor-pointer disabled:opacity-50"
        >
          <Download size={14} />
          <span>{exporting ? 'Exporting...' : 'Export'}</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={exporting || importing}
          className="flex items-center gap-1.5 rounded-full border border-border-default bg-bg-tertiary px-4 py-1.5 text-xs font-semibold text-text-primary transition-all hover:border-accent-primary hover:text-accent-primary cursor-pointer disabled:opacity-50"
        >
          <Upload size={14} />
          <span>{importing ? 'Importing...' : 'Import'}</span>
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
  );
}
