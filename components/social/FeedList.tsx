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

  useEffect(() => {
    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    return <div className="text-center p-10 text-text-muted">Loading activity feed...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-text-muted">
        <Activity size={48} className="opacity-20 mx-auto mb-4" />
        <p className="m-0 font-medium text-lg">No activity to show yet.</p>
        <p className="mt-1 text-[14px]">When your friends complete habits, they will appear here!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const hasCheered = item.feed_reactions.some(r => r.user_id === currentUserId);
        const timeAgo = new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card rounded-[24px] border border-border-default p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex-shrink-0 bg-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] text-accent-primary flex items-center justify-center font-extrabold text-[18px] overflow-hidden">
                {item.profiles?.avatar_url ? (
                  <img src={item.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  item.profiles?.full_name?.trim()?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="m-0 text-[15px] text-text-primary leading-[1.4]">
                      <span className="font-bold">{item.profiles?.full_name || 'Someone'}</span>{' '}
                      <span className="text-text-secondary">completed</span>{' '}
                      <span className="font-bold" style={{ color: item.habits?.color || 'var(--accent-primary)' }}>{item.habits?.name || 'a habit'}</span>
                    </p>
                    <p className="mt-1 text-[12px] text-text-muted font-medium">
                      {new Date(item.completed_at).toLocaleDateString()} at {timeAgo}
                    </p>
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-3 p-3 bg-bg-secondary rounded-[12px] text-[14px] text-text-primary border border-border-subtle">
                    {`"${item.notes}"`}
                  </div>
                )}

                <div className="mt-5 flex items-center gap-6">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleCheer(item.id)}
                    className={`flex items-center gap-1.5 bg-transparent border-none text-[13px] font-bold cursor-pointer transition-colors ${
                      hasCheered ? 'text-[#F43F5E]' : 'text-text-muted'
                    }`}
                  >
                    <HeartIcon size={18} fill={hasCheered ? '#F43F5E' : 'transparent'} color={hasCheered ? '#F43F5E' : 'currentColor'} />
                    {item.feed_reactions.length}
                  </motion.button>
                  <button
                    onClick={() => setActiveCommentEntryId(activeCommentEntryId === item.id ? null : item.id)}
                    className="flex items-center gap-1.5 bg-transparent border-none text-text-muted text-[13px] font-semibold cursor-pointer transition-colors"
                  >
                    <MessageSquare size={18} />
                    {item.feed_comments.length}
                  </button>
                  <button className="ml-auto flex items-center gap-1.5 bg-transparent border-none text-text-muted text-[13px] font-semibold cursor-pointer">
                    <Share2 size={18} />
                  </button>
                </div>

                <AnimatePresence>
                  {activeCommentEntryId === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <div className="flex flex-col gap-3 mb-3">
                        {item.feed_comments.map(comment => (
                          <div key={comment.id} className="flex gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-border-default flex-shrink-0 flex items-center justify-center text-[12px] font-bold">
                              {comment.profiles?.full_name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="bg-bg-secondary px-3 py-2 rounded-[16px] rounded-tl-[4px] flex-1">
                              <p className="m-0 text-[13px] font-bold text-text-primary">{comment.profiles?.full_name || 'User'}</p>
                              <p className="mt-0.5 text-[14px] text-text-primary">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitComment(item.id)}
                          className="flex-1 bg-bg-secondary border border-border-default rounded-full px-4 py-2 text-[14px] text-text-primary outline-none"
                        />
                        <button
                          onClick={() => submitComment(item.id)}
                          className="w-[38px] h-[38px] rounded-full bg-accent-primary text-accent-on-primary border-none flex items-center justify-center cursor-pointer"
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
