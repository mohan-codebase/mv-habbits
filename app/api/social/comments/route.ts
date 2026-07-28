import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { entry_id, content } = await request.json();

    if (!entry_id || !content?.trim()) {
      return NextResponse.json({ error: 'Missing entry_id or content' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('feed_comments')
      .insert({
        entry_id,
        user_id: user.id,
        content: content.trim()
      })
      .select('*, profiles(full_name, avatar_url)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
