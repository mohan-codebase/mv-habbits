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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 96px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 850, letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif", color: 'var(--text-primary)' }}>
              Your Network
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
              Connect with friends and family to share your productivity journey.
            </p>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 9999, border: 'none',
            background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: 'none',
            transition: 'transform 0.15s ease',
          }}>
            <UserPlus size={18} />
            Add Connection
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by email or username..." 
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              borderRadius: 9999, padding: '12px 16px 12px 42px',
              fontSize: 15, fontWeight: 500, color: 'var(--text-primary)',
              outline: 'none', transition: 'all 0.2s ease',
              boxShadow: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        
        {/* Friends Section */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 24,
          border: '1px solid var(--border-default)',
          padding: 24,
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 750, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users color="var(--accent-primary)" size={22} />
              Friends
            </h2>
            <span style={{
              background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
              color: 'var(--accent-primary)',
              padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 800
            }}>
              {formattedFriends.length} connections
            </span>
          </div>

          {formattedFriends.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {formattedFriends.map((f: any) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                      color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 16, overflow: 'hidden'
                    }}>
                      {f.friend?.avatar_url ? (
                        <img src={f.friend.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        f.friend?.full_name?.trim()?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.friend?.full_name || 'Unknown'}</span>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <UserPlus size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No friends yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>Start adding friends to share progress!</p>
            </div>
          )}
        </section>

        {/* Family Section */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 24,
          border: '1px solid var(--border-default)',
          padding: 24,
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 750, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart color="#F43F5E" size={22} />
              Family Groups
            </h2>
            <span style={{
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#F43F5E',
              padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 800
            }}>
              {familiesList?.length || 0} groups
            </span>
          </div>

          {familiesList && familiesList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {familiesList.map((family: any) => (
                <div key={family.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'rgba(244, 63, 94, 0.15)',
                      color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Heart size={20} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{family.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{family.family_members[0].count} members</p>
                    </div>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Manage
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Heart size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No family groups yet.</p>
              <button style={{ marginTop: 12, background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Create a Family Group
              </button>
            </div>
          )}
        </section>
      </div>
      
      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 24,
          border: '1px solid #F59E0B40',
          padding: 24,
          boxShadow: 'none',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 750, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }}></span>
            Pending Friend Requests ({pendingRequests.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingRequests.map((req: any) => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}>
                     {req.profiles?.avatar_url ? (
                        <img src={req.profiles.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UserPlus size={16} color="var(--text-muted)" />
                      )}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.profiles?.full_name || 'Someone'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-primary)', color: 'var(--accent-on-primary)', border: 'none', padding: '8px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <CheckCircle2 size={16} /> Accept
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-default)', padding: '8px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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

