import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { categorySchema } from '@/lib/validations/habit';
import { safeErrorMessage } from '@/lib/utils/api';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// GET /api/categories
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) return err(safeErrorMessage(error, 'Failed to fetch categories'), 500);
    return ok(data ?? []);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to fetch categories'), 500);
  }
}

// POST /api/categories
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const body = await req.json().catch(() => null);
    if (!body) return err('Invalid JSON body', 400);

    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message || 'Invalid category payload', 422);
    }

    const { data: maxRow } = await supabase
      .from('categories')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...parsed.data, user_id: user.id, sort_order: (maxRow?.sort_order ?? -1) + 1 })
      .select()
      .single();

    if (error) return err(safeErrorMessage(error, 'Failed to create category'), 500);
    return ok(data, 201);
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to create category'), 500);
  }
}

// DELETE /api/categories?id=...
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return err('Missing id', 400);

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return err(safeErrorMessage(error, 'Failed to delete category'), 500);
    return ok({ id, deleted: true });
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to delete category'), 500);
  }
}
