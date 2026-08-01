import React from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { Users, UserPlus, Heart, Search, CheckCircle2, XCircle } from 'lucide-react';

export const metadata = {
  title: 'Network | Productivity Master',
  description: 'Manage your friends and family connections',
};

export default async function NetworkPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch pending friend requests (no embed: friends.requester_id/addressee_id
  // reference auth.users, not public.profiles, so PostgREST can't auto-embed).
  const { data: rawPendingRequests } = await supabase
    .from('friends')
    .select('id, requester_id')
    .eq('addressee_id', user.id)
    .eq('status', 'pending');

  // Fetch friends
  const { data: rawFriendsList } = await supabase
    .from('friends')
    .select('id, requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  // Collect all user ids we need profile info for, then fetch profiles in one query.
  const relatedUserIds = Array.from(new Set([
    ...(rawPendingRequests?.map(r => r.requester_id) || []),
    ...(rawFriendsList?.flatMap(f => [f.requester_id, f.addressee_id]) || []),
  ]));

  const { data: relatedProfiles } = relatedUserIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', relatedUserIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };

  const profileMap = new Map((relatedProfiles || []).map(p => [p.id, p]));

  const pendingRequests = rawPendingRequests?.map(r => ({
    id: r.id,
    profiles: profileMap.get(r.requester_id) || null,
  })) || [];

  const formattedFriends = rawFriendsList?.map(f => {
    const isRequester = f.requester_id === user.id;
    const friendId = isRequester ? f.addressee_id : f.requester_id;
    return {
      id: f.id,
      friend: profileMap.get(friendId) || null,
    };
  }) || [];

  // Fetch families
  const { data: familiesList } = await supabase
    .from('families')
    .select(`
      id,
      name,
      owner_id,
      family_members(count)
    `)
    .or(`owner_id.eq.${user.id}`);

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 p-[16px_16px_96px_16px]">

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="m-0 text-[32px] font-[850] tracking-[-0.03em] text-text-primary [font-family:'Outfit',sans-serif]">
              Your Network
            </h1>
            <p className="m-0 mt-1 text-[14px] font-medium text-text-muted">
              Connect with friends and family to share your productivity journey.
            </p>
          </div>
          <button className="flex cursor-pointer items-center gap-2 rounded-full border-none bg-accent-primary p-[10px_16px] text-[14px] font-bold text-accent-on-primary shadow-none transition-transform duration-150 ease-in-out">
            <UserPlus size={18} />
            Add Connection
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by email or username..."
            className="box-border w-full rounded-full border border-border-default bg-bg-card p-[12px_16px_12px_42px] text-[15px] font-medium text-text-primary shadow-none outline-none transition-all duration-200 ease-in-out"
          />
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">

        {/* Friends Section */}
        <section className="flex flex-col gap-4 rounded-3xl border border-border-default bg-bg-card p-6 shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="m-0 flex items-center gap-2 text-lg font-[750] text-text-primary">
              <Users color="var(--accent-primary)" size={22} />
              Friends
            </h2>
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] p-[4px_10px] text-xs font-extrabold text-accent-primary">
              {formattedFriends.length} connections
            </span>
          </div>

          {formattedFriends.length > 0 ? (
            <div className="flex flex-col gap-3">
              {formattedFriends.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-secondary p-[8px_12px]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] text-[16px] font-extrabold text-accent-primary">
                      {f.friend?.avatar_url ? (
                        <img src={f.friend.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        f.friend?.full_name?.trim()?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <span className="font-semibold text-text-primary">{f.friend?.full_name || 'Unknown'}</span>
                  </div>
                  <button className="cursor-pointer border-none bg-transparent text-[13px] font-semibold text-text-muted">
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-[32px_16px] text-center text-text-muted">
              <UserPlus size={40} className="mb-3 opacity-30" />
              <p className="m-0 font-semibold">No friends yet.</p>
              <p className="m-0 mt-1 text-[13px]">Start adding friends to share progress!</p>
            </div>
          )}
        </section>

        {/* Family Section */}
        <section className="flex flex-col gap-4 rounded-3xl border border-border-default bg-bg-card p-6 shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="m-0 flex items-center gap-2 text-lg font-[750] text-text-primary">
              <Heart color="#F43F5E" size={22} />
              Family Groups
            </h2>
            <span className="rounded-full bg-[rgba(244,63,94,0.15)] p-[4px_10px] text-xs font-extrabold text-[#F43F5E]">
              {familiesList?.length || 0} groups
            </span>
          </div>

          {familiesList && familiesList.length > 0 ? (
            <div className="flex flex-col gap-3">
              {familiesList.map((family: any) => (
                <div key={family.id} className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-secondary p-[8px_12px]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(244,63,94,0.15)] text-[#F43F5E]">
                      <Heart size={20} />
                    </div>
                    <div>
                      <p className="m-0 font-semibold text-text-primary">{family.name}</p>
                      <p className="m-0 text-xs text-text-muted">{family.family_members[0].count} members</p>
                    </div>
                  </div>
                  <button className="cursor-pointer border-none bg-transparent text-[13px] font-bold text-accent-primary">
                    Manage
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-[32px_16px] text-center text-text-muted">
              <Heart size={40} className="mb-3 opacity-30" />
              <p className="m-0 font-semibold">No family groups yet.</p>
              <button className="mt-3 cursor-pointer border-none bg-transparent text-[14px] font-bold text-accent-primary">
                Create a Family Group
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <section className="rounded-3xl border border-[#F59E0B40] bg-bg-card p-6 shadow-none">
          <h3 className="m-0 mb-4 flex items-center gap-2 text-base font-[750] text-[#F59E0B]">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]"></span>
            Pending Friend Requests ({pendingRequests.length})
          </h3>
          <div className="flex flex-col gap-3">
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between rounded-2xl border border-border-default bg-bg-secondary p-[12px_16px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-border-default">
                     {req.profiles?.avatar_url ? (
                        <img src={req.profiles.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <UserPlus size={16} color="var(--text-muted)" />
                      )}
                  </div>
                  <span className="font-semibold text-text-primary">{req.profiles?.full_name || 'Someone'}</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex cursor-pointer items-center gap-1.5 rounded-full border-none bg-accent-primary p-[8px_14px] text-[13px] font-bold text-accent-on-primary">
                    <CheckCircle2 size={16} /> Accept
                  </button>
                  <button className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border-default bg-transparent p-[8px_14px] text-[13px] font-semibold text-text-muted">
                    <XCircle size={16} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
