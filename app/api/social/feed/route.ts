import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Thanks to Row Level Security (RLS), this query will automatically
  // ONLY return entries that the current user is allowed to see 
  // (their own, plus friends'/families' public/friends/family habits).
  
  const { data, error } = await supabase
    .from('habit_entries')
    .select(`
      id,
      entry_date,
      is_completed,
      completed_at,
      value,
      notes,
      video_path,
      profiles:user_id (id, full_name, avatar_url),
      habits:habit_id (id, name, icon, color, description, target_type, target_value, target_unit),
      feed_reactions (id, user_id),
      feed_comments (
        id, 
        user_id, 
        content, 
        created_at, 
        profiles:user_id (full_name, avatar_url)
      )
    `)
    .eq('is_completed', true)
    .neq('user_id', user.id) // Only show friends' entries on the feed
    .order('completed_at', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    console.error('Error fetching social feed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
