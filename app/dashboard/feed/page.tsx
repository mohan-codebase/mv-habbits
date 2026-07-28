import React from 'react';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import FeedList from '@/components/social/FeedList';

export const metadata = {
  title: 'Social Feed | Productivity Master',
  description: 'See what your friends and family are up to',
};

export default async function FeedPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 16px 96px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 850, letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif", color: 'var(--text-primary)' }}>
          Activity Feed
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
          Celebrate wins with your network.
        </p>
      </div>

      <FeedList currentUserId={user.id} />
    </div>
  );
}
