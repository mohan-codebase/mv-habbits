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
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 18px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl)',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 'var(--r-md)', flexShrink: 0,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-primary)',
      }}>
        <Database size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>
          Data Management
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
          Export all your data for backup or import an existing backup. Importing will overwrite conflicting records.
        </p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            <Database size={14} />
            <span>{success}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            onClick={handleExport}
            disabled={exporting || importing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              cursor: (exporting || importing) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: (exporting || importing) ? 0.6 : 1,
            }}
          >
            <Download size={15} />
            {exporting ? 'Exporting...' : 'Export Data'}
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={exporting || importing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              cursor: (exporting || importing) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: (exporting || importing) ? 0.6 : 1,
            }}
          >
            <Upload size={15} />
            {importing ? 'Importing...' : 'Import Data'}
          </button>
          <input 
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
