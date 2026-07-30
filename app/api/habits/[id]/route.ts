import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { habitSchema } from '@/lib/validations/habit';
import { toLocalDateString } from '@/lib/utils/dates';
import { safeErrorMessage } from '@/lib/utils/api';

const habitPatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(100).optional(),
  color: z.string().max(30).optional(),
  is_archived: z.boolean().optional(),
  is_bad_habit: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  current_streak: z.number().int().min(0).optional(),
  longest_streak: z.number().int().min(0).optional(),
  total_completions: z.number().int().min(0).optional(),
});

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

type Params = { params: Promise<{ id: string }> };

// GET /api/habits/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    // Fetch habit and entries concurrently
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [
      { data: habit, error },
      { data: entries }
    ] = await Promise.all([
      supabase
        .from('habits')
        .select('*, category:categories(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('habit_entries')
        .select('*')
        .eq('habit_id', id)
        .eq('user_id', user.id)
        .gte('entry_date', toLocalDateString(ninetyDaysAgo))
        .order('entry_date', { ascending: false })
    ]);

    if (error || !habit) return err('Habit not found', 404);

    return ok({ ...habit, entries: entries ?? [] });
  } catch (e) {
    return err(safeErrorMessage(e, 'Habit request failed'), 500);
  }
}

// PUT /api/habits/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const parsed = habitSchema.safeParse(body);
    if (!parsed.success) {
      return err('Invalid habit payload', 422);
    }

    const { is_bad_habit, ...habitData } = parsed.data;

    const { data: habit, error } = await supabase
      .from('habits')
      .update({
        ...habitData,
        ...(is_bad_habit !== undefined ? { is_bad_habit } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, category:categories(*)')
      .single();

    if (error) return err(safeErrorMessage(error, 'Habit request failed'), 500);
    if (!habit) return err('Habit not found', 404);

    return ok(habit);
  } catch (e) {
    return err(safeErrorMessage(e, 'Habit request failed'), 500);
  }
}

// PATCH /api/habits/[id] — partial update (archive, sort_order, etc.)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json();
    const parsed = habitPatchSchema.safeParse(body);
    if (!parsed.success) return err('Invalid patch payload', 422);
    const { is_bad_habit: patchBadHabit, ...patchRest } = parsed.data;
    const patch: Record<string, unknown> = {
      ...patchRest,
      ...(patchBadHabit !== undefined ? { is_bad_habit: patchBadHabit } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data: habit, error } = await supabase
      .from('habits')
      .update(patch)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, category:categories(*)')
      .single();

    if (error) return err(safeErrorMessage(error, 'Habit request failed'), 500);
    if (!habit) return err('Habit not found', 404);

    return ok(habit);
  } catch (e) {
    return err(safeErrorMessage(e, 'Habit request failed'), 500);
  }
}

// DELETE /api/habits/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return err(safeErrorMessage(error, 'Habit request failed'), 500);
    return ok({ id, deleted: true });
  } catch (e) {
    return err(safeErrorMessage(e, 'Habit request failed'), 500);
  }
}
