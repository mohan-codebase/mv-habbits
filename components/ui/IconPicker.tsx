'use client';

import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { DynamicIcon, HABIT_ICON_NAMES } from '@/lib/icons';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

export default function IconPicker({ value, onChange, color = 'var(--accent-primary)' }: IconPickerProps) {
  const [search, setSearch] = useState('');

  // Search is scoped to the curated, bundled set — no full-Lucide load, so
  // every result is guaranteed to render the same icon downstream.
  const filteredIcons = useMemo(() => {
    if (!search) return HABIT_ICON_NAMES;
    const query = search.toLowerCase().replace(/[-_]/g, '');
    return HABIT_ICON_NAMES.filter((n) => n.replace(/[-_]/g, '').includes(query));
  }, [search]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
          <Search size={14} />
        </div>
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-border-subtle bg-bg-tertiary py-2 pr-3 pl-8 text-[13px] text-text-primary outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-none p-1 text-text-muted"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Icon Grid */}
      <div
        className="hf-custom-scrollbar grid max-h-[200px] grid-cols-[repeat(auto-fill,minmax(36px,1fr))] gap-1.5 overflow-y-auto rounded-[12px] border border-border-subtle bg-bg-card p-1"
      >
        {filteredIcons.map((name) => {
          const active = value === name;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              title={name}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border transition-all duration-150 ${active ? '' : 'border-transparent bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
              style={active ? { border: `1px solid ${color}`, background: `${color}15`, color } : undefined}
            >
              <DynamicIcon name={name} size={18} color="currentColor" />
            </button>
          );
        })}
        {filteredIcons.length === 0 && (
          <div className="col-[1/-1] py-5 text-center text-[13px] text-text-muted">
            No icons found
          </div>
        )}
      </div>

      {/* Selected Preview */}
      <div className="flex items-center gap-2.5 px-2 py-1">
        <span className="text-xs text-text-muted">Selected:</span>
        <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color }}>
          <DynamicIcon name={value} size={16} color="currentColor" />
          <span className="[font-family:'IBM_Plex_Mono',monospace]">{value}</span>
        </div>
      </div>
    </div>
  );
}
