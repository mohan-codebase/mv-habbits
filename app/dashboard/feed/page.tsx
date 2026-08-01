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
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 pt-4 pb-24">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[32px] font-[850] tracking-[-0.03em] text-text-primary">
          Activity Feed
        </h1>
        <p className="m-0 text-sm font-medium text-text-muted">
          Celebrate wins with your network.
        </p>
      </div>

      <FeedList currentUserId={user.id} />
    </div>
  );
}
