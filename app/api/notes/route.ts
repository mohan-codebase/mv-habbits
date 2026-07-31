import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export interface NoteItem {
  id: string;
  habit_id: string;
  user_id: string;
  entry_date: string;
  is_completed: boolean;
  notes: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  habit: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    target_type: string;
    target_unit: string | null;
  } | null;
}

// GET /api/notes?search=&habit_id=
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const sp = req.nextUrl.searchParams;
    const search = sp.get('search')?.trim().toLowerCase() ?? '';
    const habitId = sp.get('habit_id');

    let query = supabase
      .from('habit_entries')
      .select(`
        id,
        habit_id,
        user_id,
        entry_date,
        is_completed,
        notes,
        completed_at,
        created_at,
        updated_at,
        habits (
          id,
          name,
          icon,
          color,
          target_type,
          target_unit
        )
      `)
      .eq('user_id', user.id)
      .not('notes', 'is', null)
      .neq('notes', '');

    if (habitId) {
      query = query.eq('habit_id', habitId);
    }

    query = query.order('entry_date', { ascending: false }).limit(300);

    const { data, error } = await query;
    if (error) return err(safeErrorMessage(error, 'Failed to fetch notes'), 500);

    interface EntryWithHabitRow {
      id: string;
      habit_id: string;
      user_id: string;
      entry_date: string;
      is_completed: boolean;
      notes: string;
      completed_at: string | null;
      created_at: string;
      updated_at: string;
      habits?: NoteItem['habit'] | NoteItem['habit'][];
    }

    // Transform joined habits data cleanly
    let notes: NoteItem[] = ((data as unknown as EntryWithHabitRow[]) ?? []).map((row) => ({
      id: row.id,
      habit_id: row.habit_id,
      user_id: row.user_id,
      entry_date: row.entry_date,
      is_completed: row.is_completed,
      notes: row.notes,
      completed_at: row.completed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      habit: Array.isArray(row.habits) ? row.habits[0] ?? null : row.habits ?? null,
    }));

    if (search) {
      notes = notes.filter((n: NoteItem) => {
        const noteMatch = n.notes.toLowerCase().includes(search);
        const habitMatch = n.habit?.name?.toLowerCase().includes(search) ?? false;
        const dateMatch = n.entry_date.includes(search);
        return noteMatch || habitMatch || dateMatch;
      });
    }

    return ok(notes);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to fetch notes'), 500);
  }
}

// POST /api/notes — Add/Upsert a note for a habit entry
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const { habit_id, entry_date, notes, is_completed } = body;

    if (!habit_id || typeof habit_id !== 'string') return err('Missing habit_id', 400);
    if (!entry_date || typeof entry_date !== 'string') return err('Missing entry_date', 400);
    if (notes === undefined || notes === null) return err('Missing notes', 400);

    // Verify habit ownership
    const { data: habit, error: habitErr } = await supabase
      .from('habits')
      .select('id')
      .eq('id', habit_id)
      .eq('user_id', user.id)
      .single();

    if (habitErr || !habit) return err('Habit not found', 404);

    const now = new Date().toISOString();
    const notesText = String(notes).trim();

    // Fetch existing entry if any to preserve completion state unless passed
    const { data: existing } = await supabase
      .from('habit_entries')
      .select('is_completed, completed_at')
      .eq('habit_id', habit_id)
      .eq('entry_date', entry_date)
      .single();

    const completedState = is_completed !== undefined ? Boolean(is_completed) : (existing?.is_completed ?? false);

    const { data: updatedEntry, error: upsertErr } = await supabase
      .from('habit_entries')
      .upsert({
        habit_id,
        user_id: user.id,
        entry_date,
        notes: notesText || null,
        is_completed: completedState,
        completed_at: completedState ? (existing?.completed_at ?? now) : null,
        updated_at: now,
      }, { onConflict: 'habit_id,entry_date' })
      .select(`
        id,
        habit_id,
        user_id,
        entry_date,
        is_completed,
        notes,
        completed_at,
        created_at,
        updated_at,
        habits (
          id,
          name,
          icon,
          color,
          target_type,
          target_unit
        )
      `)
      .single();

    if (upsertErr) return err(safeErrorMessage(upsertErr, 'Failed to save note'), 500);

    const formatted = {
      id: updatedEntry.id,
      habit_id: updatedEntry.habit_id,
      user_id: updatedEntry.user_id,
      entry_date: updatedEntry.entry_date,
      is_completed: updatedEntry.is_completed,
      notes: updatedEntry.notes,
      completed_at: updatedEntry.completed_at,
      created_at: updatedEntry.created_at,
      updated_at: updatedEntry.updated_at,
      habit: Array.isArray(updatedEntry.habits) ? updatedEntry.habits[0] ?? null : updatedEntry.habits ?? null,
    };

    return ok(formatted);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to save note'), 500);
  }
}

// DELETE /api/notes?id=ENTRY_ID
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const sp = req.nextUrl.searchParams;
    const entryId = sp.get('id');

    if (!entryId) return err('Missing entry id', 400);

    // Clear the note field on the habit entry
    const { data, error } = await supabase
      .from('habit_entries')
      .update({ notes: null, updated_at: new Date().toISOString() })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return err(safeErrorMessage(error, 'Failed to remove note'), 500);

    return ok(data);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to remove note'), 500);
  }
}
