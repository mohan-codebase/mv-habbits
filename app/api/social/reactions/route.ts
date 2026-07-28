import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { entry_id } = await request.json();

    if (!entry_id) {
      return NextResponse.json({ error: 'Missing entry_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('feed_reactions')
      .insert({
        entry_id,
        user_id: user.id
      });

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ message: 'Already cheered' }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error adding reaction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const entry_id = url.searchParams.get('entry_id');

    if (!entry_id) {
      return NextResponse.json({ error: 'Missing entry_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('feed_reactions')
      .delete()
      .match({ entry_id, user_id: user.id });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing reaction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
