'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Flame, Trophy, Award, Target } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { OverviewStats } from '@/types/analytics';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: OverviewStats | null;
}

export default function ShareModal({ isOpen, onClose, stats }: ShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  if (!stats) return null;

  const level = Math.floor(stats.totalCompletions / 50) + 1;
  const rank = stats.totalCompletions >= 500 ? 'Master' : stats.totalCompletions >= 250 ? 'Elite' : stats.totalCompletions >= 100 ? 'Pro' : 'Adept';

  const shareText = `My streak is at ${stats.bestStreak} days on Productivity Master! Just reached Level ${level} (${rank}). How's your consistency? #Productivity Master #Productivity`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Your Progress" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
        
        {/* The "Card" for Screenshotting */}
        <div
          id="share-card"
          style={{
            background: 'linear-gradient(135deg, #171717 0%, #282828 100%)',
            borderRadius: 24,
            padding: 32,
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255,0.1)',
            boxShadow: 'none',
            color: 'white',
          }}
        >
          {/* Abstract background glows */}
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 15%, transparent) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(137, 137, 137,0.1) 0%, transparent 70%)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={18} color="black" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', fontFamily: "'Outfit'" }}>Productivity Master</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(137, 137, 137,0.15)', border: '1px solid rgba(137, 137, 137,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#b6b6b6' }}>
                  {level}
                </div>
                <div>
                  <p style={{ fontSize: 13, color: 'rgba(255, 255, 255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Level & Rank</p>
                  <p style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit'" }}>{rank} Optimizer</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'rgba(255, 255, 255,0.04)', padding: 16, borderRadius: 16, border: '1px solid rgba(255, 255, 255,0.06)' }}>
                  <Flame size={16} color="#a6a6a6" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Outfit'" }}>{stats.bestStreak}<span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255, 255, 255,0.4)', marginLeft: 4 }}>days</span></p>
                  <p style={{ fontSize: 11, color: 'rgba(255, 255, 255,0.5)', fontWeight: 500 }}>Top Streak</p>
                </div>
                <div style={{ background: 'rgba(255, 255, 255,0.04)', padding: 16, borderRadius: 16, border: '1px solid rgba(255, 255, 255,0.06)' }}>
                  <Trophy size={16} color="var(--accent-primary)" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Outfit'" }}>{stats.totalCompletions}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255, 255, 255,0.5)', fontWeight: 500 }}>Total Habits</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255,0.08)', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'rgba(255, 255, 255,0.4)', fontWeight: 500 }}>Tracked at productivity-master.app</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Snapshot your progress or copy the summary below.
          </p>
          
          <div
            style={{
              background: 'var(--bg-tertiary)',
              padding: 14,
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              fontSize: 13,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              position: 'relative',
            }}
          >
            {shareText}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="secondary"
              fullWidth
              onClick={handleCopy}
              icon={copied ? <Check size={15} /> : <Copy size={15} />}
            >
              {copied ? 'Copied' : 'Copy Text'}
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'My Productivity Master Stats',
                    text: shareText,
                    url: window.location.origin,
                  });
                } else {
                  handleCopy();
                }
              }}
              icon={<Share2 size={15} />}
            >
              Share Link
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
