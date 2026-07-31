'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotebookPen,
  Search,
  Plus,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Edit3,
  Trash2,
  Sparkles,
  ExternalLink,
  BookOpen,
  X,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isToday, isYesterday, startOfMonth } from 'date-fns';
import { DynamicIcon } from '@/lib/icons';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { NoteItem } from '@/app/api/notes/route';

interface SimpleHabit {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export default function CentralizedNotesPage() {
  const { toast } = useToast();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [habits, setHabits] = useState<SimpleHabit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('ALL');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [formHabitId, setFormHabitId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formText, setFormText] = useState('');
  const [formCompleted, setFormCompleted] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<NoteItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch initial notes and user habits
  const fetchNotesAndHabits = async () => {
    setLoading(true);
    try {
      const [notesRes, habitsRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/habits'),
      ]);

      if (notesRes.ok) {
        const json = await notesRes.json();
        setNotes(json.data ?? []);
      }
      if (habitsRes.ok) {
        const json = await habitsRes.json();
        setHabits((json.data ?? []).map((h: SimpleHabit) => ({
          id: h.id,
          name: h.name,
          color: h.color,
          icon: h.icon,
        })));
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      toast('Failed to load notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [notesRes, habitsRes] = await Promise.all([
          fetch('/api/notes'),
          fetch('/api/habits'),
        ]);

        if (cancelled) return;

        if (notesRes.ok) {
          const json = await notesRes.json();
          setNotes(json.data ?? []);
        }
        if (habitsRes.ok) {
          const json = await habitsRes.json();
          setHabits((json.data ?? []).map((h: SimpleHabit) => ({
            id: h.id,
            name: h.name,
            color: h.color,
            icon: h.icon,
          })));
        }
      } catch (err) {
        console.error('Error loading notes:', err);
        toast('Failed to load notes', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Filtered notes calculation
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesHabit = selectedHabitId === 'ALL' || n.habit_id === selectedHabitId;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        n.notes.toLowerCase().includes(q) ||
        (n.habit?.name?.toLowerCase().includes(q) ?? false) ||
        n.entry_date.includes(q);
      return matchesHabit && matchesQuery;
    });
  }, [notes, selectedHabitId, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const uniqueHabitIds = new Set(notes.map((n) => n.habit_id)).size;
    const thisMonthStart = startOfMonth(new Date()).toISOString().split('T')[0];
    const notesThisMonth = notes.filter((n) => n.entry_date >= thisMonthStart).length;

    return { totalNotes, uniqueHabitIds, notesThisMonth };
  }, [notes]);

  // Handlers for modal
  const openNewNoteModal = () => {
    setEditingNote(null);
    setFormHabitId(habits[0]?.id ?? '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormText('');
    setFormCompleted(true);
    setIsModalOpen(true);
  };

  const openEditNoteModal = (note: NoteItem) => {
    setEditingNote(note);
    setFormHabitId(note.habit_id);
    setFormDate(note.entry_date);
    setFormText(note.notes);
    setFormCompleted(note.is_completed);
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHabitId) {
      toast('Please select a habit', 'error');
      return;
    }
    if (!formText.trim()) {
      toast('Note content cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: formHabitId,
          entry_date: formDate,
          notes: formText.trim(),
          is_completed: formCompleted,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save note');

      toast(editingNote ? 'Note updated successfully' : 'Note added successfully', 'success');
      setIsModalOpen(false);
      fetchNotesAndHabits();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save note';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete note');

      toast('Note removed successfully', 'success');
      setDeleteTarget(null);
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete note';
      toast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyNote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 60px', width: '100%' }}>
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'var(--accent-glow)',
                border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <NotebookPen size={20} />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              Centralized Habit Notes
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            All thoughts, reflection logs, and progress notes recorded across your habits in one place.
          </p>
        </div>

        <Button
          onClick={openNewNoteModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 9999,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          <Plus size={17} />
          Add Note
        </Button>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
              {stats.totalNotes}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Total Notes Saved</p>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(168, 85, 247, 0.12)',
              color: '#A855F7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
              {stats.uniqueHabitIds}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Habits with Notes</p>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit'" }}>
              {stats.notesThisMonth}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Added This Month</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 240 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search notes by content, habit name, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 9999,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Habits</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes Grid / List */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} style={{ height: 180, borderRadius: 16 }} />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-default)',
            borderRadius: 20,
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--surface-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <NotebookPen size={28} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              {searchQuery || selectedHabitId !== 'ALL' ? 'No notes match your filters' : 'No notes recorded yet'}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', maxWidth: 420 }}>
              {searchQuery || selectedHabitId !== 'ALL'
                ? 'Try adjusting your search keywords or habit filter.'
                : 'Whenever you log a note when completing a habit, it will automatically show up here! You can also click below to add a note.'}
            </p>
          </div>
          {!searchQuery && selectedHabitId === 'ALL' && (
            <Button onClick={openNewNoteModal} style={{ borderRadius: 9999, marginTop: 8 }}>
              <Plus size={16} style={{ marginRight: 6 }} />
              Create First Note
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          <AnimatePresence>
            {filteredNotes.map((note) => {
              const habitColor = note.habit?.color ?? 'var(--accent-primary)';
              const habitIcon = note.habit?.icon ?? 'target';
              const isCopied = copiedId === note.id;

              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 18,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    position: 'relative',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  className="hf-note-card"
                >
                  {/* Top Bar: Habit Pill & Date */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <Link
                        href={`/dashboard/habits/${note.habit_id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 9999,
                          background: `color-mix(in srgb, ${habitColor} 12%, transparent)`,
                          color: habitColor,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                          maxWidth: '70%',
                        }}
                      >
                        <DynamicIcon name={habitIcon} size={14} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {note.habit?.name ?? 'Habit Note'}
                        </span>
                        <ExternalLink size={11} style={{ opacity: 0.7, flexShrink: 0 }} />
                      </Link>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                        <Calendar size={13} />
                        <span>{formatDateLabel(note.entry_date)}</span>
                      </div>
                    </div>

                    {/* Note Content */}
                    <div
                      style={{
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {note.notes}
                    </div>
                  </div>

                  {/* Footer Bar: Completion Status & Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        color: note.is_completed ? '#22C55E' : 'var(--text-muted)',
                      }}
                    >
                      {note.is_completed ? (
                        <>
                          <CheckCircle2 size={14} color="#22C55E" />
                          <span>Habit Completed</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} color="var(--text-muted)" />
                          <span>Log Note Only</span>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => handleCopyNote(note.id, note.notes)}
                        title="Copy note text"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: 8,
                          color: isCopied ? '#22C55E' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-tint)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        {isCopied ? <Check size={15} /> : <Copy size={15} />}
                      </button>

                      <button
                        onClick={() => openEditNoteModal(note)}
                        title="Edit note"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: 8,
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-tint)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(note)}
                        title="Delete note"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: 8,
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; e.currentTarget.style.color = '#EF4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Note Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div style={{ padding: 4 }}>
          <h2
            style={{
              margin: '0 0 4px',
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {editingNote ? 'Edit Habit Note' : 'Add Habit Note'}
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
            {editingNote ? 'Update your reflection or notes for this entry.' : 'Select a habit and record your reflection or journal note.'}
          </p>

          <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Habit selector */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Habit
              </label>
              <select
                value={formHabitId}
                onChange={(e) => setFormHabitId(e.target.value)}
                disabled={Boolean(editingNote)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date selector */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                disabled={Boolean(editingNote)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Note text */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Note / Journal Content
              </label>
              <textarea
                rows={4}
                placeholder="What did you learn today? How did you feel while completing this habit?"
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Completion Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={formCompleted}
                onChange={(e) => setFormCompleted(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              Mark habit as completed for this date
            </label>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <div style={{ padding: 4, textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Trash2 size={24} />
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>
            Delete Note?
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)' }}>
            Are you sure you want to remove this note? The habit completion record will remain intact.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteNote}
              disabled={deleting}
              style={{ background: '#EF4444', color: '#FFF' }}
            >
              {deleting ? 'Deleting...' : 'Delete Note'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
