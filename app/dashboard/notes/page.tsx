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
  Lock,
  Unlock,
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

  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

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
    <div className="mx-auto w-full max-w-[1100px] p-[16px_12px_90px] md:p-[24px_16px_60px]">
      {/* Header section */}
      <div className="mb-5 md:mb-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="mb-1.5 md:mb-1 flex items-center gap-2 md:gap-2.5">
            <div className="flex h-[34px] w-[34px] md:h-[38px] md:w-[38px] items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_25%,transparent)] bg-accent-glow text-accent-primary">
              <NotebookPen size={18} className="md:w-5 md:h-5" />
            </div>
            <h1 className="m-0 text-[22px] md:text-[26px] font-extrabold tracking-[-0.02em] text-text-primary [font-family:'Outfit',sans-serif]">
              Centralized Habit Notes
            </h1>
          </div>
          <p className="m-0 text-[13px] md:text-[14px] text-text-muted hidden sm:block">
            All thoughts, reflection logs, and progress notes recorded across your habits in one place.
          </p>
        </div>

        <div className="flex w-full md:w-auto items-center gap-2.5 md:gap-3">
          {isVaultUnlocked ? (
            <Button
              variant="ghost"
              onClick={() => setIsVaultUnlocked(false)}
              className="flex-1 md:flex-none justify-center rounded-full px-4 py-2.5 md:py-2 text-[13px] md:text-sm text-text-muted hover:text-text-primary bg-bg-glass md:bg-transparent border border-border-default md:border-transparent"
              icon={<Lock size={16} />}
            >
              Lock Vault
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowVaultModal(true)}
              className="flex-1 md:flex-none justify-center rounded-full px-4 py-2.5 md:py-2 text-[13px] md:text-sm text-text-muted hover:text-text-primary bg-bg-glass md:bg-transparent border border-border-default md:border-transparent"
              icon={<Unlock size={16} />}
            >
              Unlock Vault
            </Button>
          )}
          <Button
            onClick={openNewNoteModal}
            className="flex-1 md:flex-none justify-center rounded-full px-5 py-2.5 text-[13px] md:text-sm"
            icon={<Plus size={16} />}
          >
            Add Note
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-5 md:mb-7 flex snap-x snap-mandatory overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 gap-3 md:gap-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="min-w-[75%] sm:min-w-[45%] md:min-w-0 snap-center flex items-center gap-3 md:gap-4 rounded-2xl border border-border-default bg-bg-glass p-[12px_16px] md:p-[16px_20px]">
          <div className="flex h-[40px] w-[40px] md:h-[44px] md:w-[44px] items-center justify-center rounded-xl bg-[rgba(59,130,246,0.12)] text-[#3B82F6]">
            <FileText size={20} className="md:w-[22px] md:h-[22px]" />
          </div>
          <div>
            <p className="m-0 text-[22px] md:text-2xl font-extrabold text-text-primary [font-family:'Outfit'] leading-none">
              {stats.totalNotes}
            </p>
            <p className="m-0 mt-1 text-[11px] md:text-xs font-semibold text-text-muted">Total Notes Saved</p>
          </div>
        </div>

        <div className="min-w-[75%] sm:min-w-[45%] md:min-w-0 snap-center flex items-center gap-3 md:gap-4 rounded-2xl border border-border-default bg-bg-glass p-[12px_16px] md:p-[16px_20px]">
          <div className="flex h-[40px] w-[40px] md:h-[44px] md:w-[44px] items-center justify-center rounded-xl bg-[rgba(168,85,247,0.12)] text-[#A855F7]">
            <BookOpen size={20} className="md:w-[22px] md:h-[22px]" />
          </div>
          <div>
            <p className="m-0 text-[22px] md:text-2xl font-extrabold text-text-primary [font-family:'Outfit'] leading-none">
              {stats.uniqueHabitIds}
            </p>
            <p className="m-0 mt-1 text-[11px] md:text-xs font-semibold text-text-muted">Habits with Notes</p>
          </div>
        </div>

        <div className="min-w-[75%] sm:min-w-[45%] md:min-w-0 snap-center flex items-center gap-3 md:gap-4 rounded-2xl border border-border-default bg-bg-glass p-[12px_16px] md:p-[16px_20px]">
          <div className="flex h-[40px] w-[40px] md:h-[44px] md:w-[44px] items-center justify-center rounded-xl bg-[rgba(34,197,94,0.12)] text-[#22C55E]">
            <Sparkles size={20} className="md:w-[22px] md:h-[22px]" />
          </div>
          <div>
            <p className="m-0 text-[22px] md:text-2xl font-extrabold text-text-primary [font-family:'Outfit'] leading-none">
              {stats.notesThisMonth}
            </p>
            <p className="m-0 mt-1 text-[11px] md:text-xs font-semibold text-text-muted">Added This Month</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-5 md:mb-6 flex items-center justify-between rounded-2xl border border-border-default bg-bg-glass p-2 md:p-[12px_16px]">
        <div className="flex flex-1 items-center gap-2 md:gap-2.5 pl-2 md:pl-0 pr-2">
          <Search size={16} color="var(--text-muted)" className="md:w-[18px] md:h-[18px]" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none bg-transparent text-[13px] md:text-[14px] text-text-primary outline-none [font-family:inherit]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="flex cursor-pointer items-center border-none bg-transparent p-0.5 text-text-muted"
            >
              <X size={14} className="md:w-4 md:h-4" />
            </button>
          )}
        </div>

        <div className="h-[24px] w-[1px] bg-border-subtle shrink-0 mx-1 md:hidden" />

        <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0 pl-1 md:pl-0">
          <Filter size={14} color="var(--text-muted)" className="hidden md:block md:w-4 md:h-4" />
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="cursor-pointer rounded-full border-none md:border md:border-border-default bg-transparent md:bg-bg-card p-[4px_8px] md:p-[6px_14px] text-[12px] md:text-[13px] font-semibold text-text-primary outline-none max-w-[100px] md:max-w-none text-ellipsis"
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[180px] rounded-[16px]" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center gap-3.5 rounded-[20px] border border-border-default bg-bg-glass p-[48px_24px] text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-tint)] text-text-muted">
            <NotebookPen size={28} />
          </div>
          <div>
            <h3 className="m-0 mb-1.5 text-[17px] font-bold text-text-primary">
              {searchQuery || selectedHabitId !== 'ALL' ? 'No notes match your filters' : 'No notes recorded yet'}
            </h3>
            <p className="m-0 max-w-[420px] text-[14px] text-text-muted">
              {searchQuery || selectedHabitId !== 'ALL'
                ? 'Try adjusting your search keywords or habit filter.'
                : 'Whenever you log a note when completing a habit, it will automatically show up here! You can also click below to add a note.'}
            </p>
          </div>
          {!searchQuery && selectedHabitId === 'ALL' && (
            <Button onClick={openNewNoteModal} className="rounded-full mt-2">
              <Plus size={16} className="mr-1.5" />
              Create First Note
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
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
                  className="hf-note-card relative flex flex-col justify-between gap-4 rounded-[18px] border border-border-default bg-bg-card p-5 transition-[border-color,box-shadow] duration-150 ease-in-out"
                >
                  {/* Top Bar: Habit Pill & Date */}
                  <div className="flex flex-1 flex-col">
                    <div className="mb-3 flex items-center justify-between gap-2.5">
                      <Link
                        href={`/dashboard/habits/${note.habit_id}`}
                        className="inline-flex max-w-[70%] items-center gap-1.5 rounded-full p-[4px_10px] text-xs font-bold no-underline"
                        style={{
                          background: `color-mix(in srgb, ${habitColor} 12%, transparent)`,
                          color: habitColor,
                        }}
                      >
                        <DynamicIcon name={habitIcon} size={14} />
                        <span className="truncate">
                          {note.habit?.name ?? 'Habit Note'}
                        </span>
                        <ExternalLink size={11} className="shrink-0 opacity-70" />
                      </Link>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                        <Calendar size={13} />
                        <span>{formatDateLabel(note.entry_date)}</span>
                      </div>
                    </div>

                    {/* Note Content */}
                    <div 
                      className={`relative flex-1 ${!isVaultUnlocked ? 'flex cursor-pointer select-none' : 'whitespace-pre-wrap break-words text-[14px] leading-[1.6] text-text-primary'}`}
                      onClick={() => !isVaultUnlocked && setShowVaultModal(true)}
                    >
                      {!isVaultUnlocked ? (
                        <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-default bg-[var(--surface-tint)] p-4 text-text-muted transition-colors hover:bg-[var(--surface-tint-mid)] hover:text-text-primary">
                          <Lock size={16} />
                          <span className="text-xs font-semibold">Note Locked. Click to view.</span>
                        </div>
                      ) : (
                        note.notes
                      )}
                    </div>
                  </div>

                  {/* Footer Bar: Completion Status & Actions */}
                  <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                    <div
                      className={`flex items-center gap-1.5 text-xs font-semibold ${note.is_completed ? 'text-[#22C55E]' : 'text-text-muted'}`}
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

                    <div className="flex items-center gap-1.5">
                      {isVaultUnlocked ? (
                        <>
                          <button
                            onClick={() => handleCopyNote(note.id, note.notes)}
                            title="Copy note text"
                            className={`flex cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-1.5 transition-[background,color] duration-150 hover:bg-[var(--surface-tint)] ${isCopied ? 'text-[#22C55E]' : 'text-text-muted'}`}
                          >
                            {isCopied ? <Check size={15} /> : <Copy size={15} />}
                          </button>

                          <button
                            onClick={() => openEditNoteModal(note)}
                            title="Edit note"
                            className="group flex cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-1.5 text-text-muted transition-[background,color] duration-150 hover:bg-[var(--surface-tint)] hover:text-text-primary"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(note)}
                            title="Delete note"
                            className="flex cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-1.5 text-text-muted transition-[background,color] duration-150 hover:bg-[rgba(239,68,68,0.12)] hover:text-[#EF4444]"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowVaultModal(true)}
                          title="Unlock Vault"
                          className="flex cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-1.5 text-text-muted transition-[background,color] duration-150 hover:bg-[var(--surface-tint)] hover:text-text-primary"
                        >
                          <Lock size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      {/* Vault Unlock Modal */}
      <Modal isOpen={showVaultModal} onClose={() => setShowVaultModal(false)}>
        <div className="p-1 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(168,85,247,0.12)] text-[#A855F7] shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <Lock size={30} />
          </div>
          <h2 className="m-0 mb-2 text-[22px] font-extrabold text-text-primary [font-family:'Outfit']">
            Unlock Vault
          </h2>
          <p className="m-0 mb-6 text-[14px] text-text-muted">
            Your notes are secured. Unlock the vault to read and edit your personal reflections.
          </p>

          <div className="flex justify-center gap-3 flex-row-reverse">
            <Button
              onClick={() => {
                setIsVaultUnlocked(true);
                setShowVaultModal(false);
              }}
              className="bg-[#A855F7] text-white hover:bg-[#9333EA]"
              icon={<Unlock size={16} />}
            >
              Unlock Now
            </Button>
            <Button variant="ghost" onClick={() => setShowVaultModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Note Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-1">
          <h2 className="m-0 mb-1 text-xl font-extrabold text-text-primary [font-family:'Outfit',sans-serif]">
            {editingNote ? 'Edit Habit Note' : 'Add Habit Note'}
          </h2>
          <p className="m-0 mb-5 text-[13px] text-text-muted">
            {editingNote ? 'Update your reflection or notes for this entry.' : 'Select a habit and record your reflection or journal note.'}
          </p>

          <form onSubmit={handleSaveNote} className="flex flex-col gap-4">
            {/* Habit selector */}
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-text-primary">
                Habit
              </label>
              <select
                value={formHabitId}
                onChange={(e) => setFormHabitId(e.target.value)}
                disabled={Boolean(editingNote)}
                className="w-full rounded-xl border border-border-default bg-bg-card p-[10px_14px] text-[14px] font-semibold text-text-primary outline-none"
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
              <label className="mb-1.5 block text-[13px] font-bold text-text-primary">
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                disabled={Boolean(editingNote)}
                className="w-full rounded-xl border border-border-default bg-bg-card p-[10px_14px] text-[14px] text-text-primary outline-none [font-family:inherit]"
              />
            </div>

            {/* Note text */}
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-text-primary">
                Note / Journal Content
              </label>
              <textarea
                rows={4}
                placeholder="What did you learn today? How did you feel while completing this habit?"
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                required
                className="w-full resize-y rounded-xl border border-border-default bg-bg-card p-[12px_14px] text-[14px] leading-normal text-text-primary outline-none [font-family:inherit]"
              />
            </div>

            {/* Completion Checkbox */}
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px] font-semibold text-text-primary">
              <input
                type="checkbox"
                checked={formCompleted}
                onChange={(e) => setFormCompleted(e.target.checked)}
                className="h-[18px] w-[18px] cursor-pointer accent-accent-primary"
              />
              Mark habit as completed for this date
            </label>

            {/* Actions */}
            <div className="mt-2 flex justify-end gap-3">
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
        <div className="p-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(239,68,68,0.12)] text-[#EF4444]">
            <Trash2 size={24} />
          </div>
          <h2 className="m-0 mb-1.5 text-[19px] font-extrabold text-text-primary">
            Delete Note?
          </h2>
          <p className="m-0 mb-6 text-[14px] text-text-muted">
            Are you sure you want to remove this note? The habit completion record will remain intact.
          </p>

          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteNote}
              disabled={deleting}
              icon={deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            >
              Delete Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
