'use client';

import React, { useState, useEffect } from 'react';
import { Activity, MessageSquare, Heart as HeartIcon, Share2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedReaction {
  id: string;
  user_id: string;
}

interface FeedComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface FeedItem {
  id: string;
  entry_date: string;
  is_completed: boolean;
  completed_at: string;
  value: number;
  notes: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  habits: {
    name: string;
    icon: string;
    color: string;
  };
  feed_reactions: FeedReaction[];
  feed_comments: FeedComment[];
}

export default function FeedList({ currentUserId }: { currentUserId: string }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentEntryId, setActiveCommentEntryId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/social/feed');
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        setItems(json.data);
      } else {
        // Fallback mock data so you can see the UI without real friends!
        setItems([
          {
            id: 'mock-1',
            entry_date: new Date().toISOString(),
            is_completed: true,
            completed_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
            value: 1,
            notes: 'Felt great today! Pushed myself a bit further.',
            profiles: {
              id: 'user-2',
              full_name: 'Sarah Connor',
              avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            },
            habits: {
              name: 'Morning Workout',
              icon: 'activity',
              color: '#F43F5E',
            },
            feed_reactions: [
              { id: 'r1', user_id: 'user-3' },
              { id: 'r2', user_id: 'user-4' },
            ],
            feed_comments: [
              {
                id: 'c1',
                user_id: 'user-3',
                content: 'Keep it up!',
                created_at: new Date().toISOString(),
                profiles: { full_name: 'John Doe', avatar_url: '' }
              }
            ]
          },
          {
            id: 'mock-2',
            entry_date: new Date().toISOString(),
            is_completed: true,
            completed_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
            value: 1,
            notes: '',
            profiles: {
              id: 'user-3',
              full_name: 'John Doe',
              avatar_url: '',
            },
            habits: {
              name: 'Read 5 Pages',
              icon: 'book',
              color: '#3B82F6',
            },
            feed_reactions: [],
            feed_comments: []
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheer = async (entryId: string) => {
    // Optimistic update
    setItems(current => current.map(item => {
      if (item.id === entryId) {
        const hasCheered = item.feed_reactions.some(r => r.user_id === currentUserId);
        const newReactions = hasCheered 
          ? item.feed_reactions.filter(r => r.user_id !== currentUserId)
          : [...item.feed_reactions, { id: 'temp', user_id: currentUserId }];
        return { ...item, feed_reactions: newReactions };
      }
      return item;
    }));

    try {
      // Mock Data Handling: If this is a mock item, don't hit the API
      if (entryId.startsWith('mock-')) {
        return; 
      }

      // Find if we already cheered
      const item = items.find(i => i.id === entryId);
      const hasCheered = item?.feed_reactions.some(r => r.user_id === currentUserId);
      
      if (hasCheered) {
        await fetch(`/api/social/reactions?entry_id=${entryId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/social/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry_id: entryId })
        });
        
        // Throw some confetti logic could go here
      }
    } catch (err) {
      console.error(err);
      fetchFeed(); // revert on failure
    }
  };

  const submitComment = async (entryId: string) => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    
    // Mock Data Handling: If this is a mock item, just add it to state directly
    if (entryId.startsWith('mock-')) {
      setItems(current => current.map(item => {
        if (item.id === entryId) {
          return { 
            ...item, 
            feed_comments: [...item.feed_comments, {
              id: Date.now().toString(),
              user_id: currentUserId,
              content: text,
              created_at: new Date().toISOString(),
              profiles: { full_name: 'You', avatar_url: '' }
            }] 
          };
        }
        return item;
      }));
      return;
    }

    try {
      const res = await fetch('/api/social/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, content: text })
      });
      const json = await res.json();
      
      if (json.success) {
        setItems(current => current.map(item => {
          if (item.id === entryId) {
            return { ...item, feed_comments: [...item.feed_comments, json.data] };
          }
          return item;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading activity feed...</div>;
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
        <Activity size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
        <p style={{ margin: 0, fontWeight: 500, fontSize: 16 }}>No activity to show yet.</p>
        <p style={{ margin: '4px 0 0', fontSize: 14 }}>When your friends complete habits, they will appear here!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((item) => {
        const hasCheered = item.feed_reactions.some(r => r.user_id === currentUserId);
        const timeAgo = new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return (
          <motion.div 
            key={item.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 24,
              border: '1px solid var(--border-default)',
              padding: 24,
              boxShadow: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
                color: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 18, overflow: 'hidden'
              }}>
                {item.profiles?.avatar_url ? (
                  <img src={item.profiles.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  item.profiles?.full_name?.trim()?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 700 }}>{item.profiles?.full_name || 'Someone'}</span>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>completed</span>{' '}
                      <span style={{ fontWeight: 700, color: item.habits?.color || 'var(--accent-primary)' }}>{item.habits?.name || 'a habit'}</span>
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                      {new Date(item.completed_at).toLocaleDateString()} at {timeAgo}
                    </p>
                  </div>
                </div>

                {item.notes && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 12, fontSize: 14, color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                    "{item.notes}"
                  </div>
                )}

                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleCheer(item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: hasCheered ? '#F43F5E' : 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'color 0.2s' }}
                  >
                    <HeartIcon size={18} fill={hasCheered ? '#F43F5E' : 'transparent'} color={hasCheered ? '#F43F5E' : 'currentColor'} />
                    {item.feed_reactions.length}
                  </motion.button>
                  <button 
                    onClick={() => setActiveCommentEntryId(activeCommentEntryId === item.id ? null : item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
                  >
                    <MessageSquare size={18} />
                    {item.feed_comments.length}
                  </button>
                  <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Share2 size={18} />
                  </button>
                </div>

                <AnimatePresence>
                  {activeCommentEntryId === item.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: 16, overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                        {item.feed_comments.map(comment => (
                          <div key={comment.id} style={{ display: 'flex', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border-default)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                              {comment.profiles?.full_name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 16, borderTopLeftRadius: 4, flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{comment.profiles?.full_name || 'User'}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--text-primary)' }}>{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <input 
                          type="text" 
                          placeholder="Write a comment..." 
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitComment(item.id)}
                          style={{
                            flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                            borderRadius: 9999, padding: '8px 16px', fontSize: 14, color: 'var(--text-primary)', outline: 'none'
                          }}
                        />
                        <button 
                          onClick={() => submitComment(item.id)}
                          style={{
                            width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                          }}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
