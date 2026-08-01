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
      <div className="flex flex-col gap-6 py-2.5">

        {/* The "Card" for Screenshotting */}
        <div
          id="share-card"
          className="relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(135deg,#171717_0%,#282828_100%)] p-8 text-white shadow-none"
        >
          {/* Abstract background glows */}
          <div className="absolute -right-[10%] -top-[20%] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent-primary)_15%,transparent)_0%,transparent_70%)]" />
          <div className="absolute -bottom-[10%] -left-[5%] h-[150px] w-[150px] rounded-full bg-[radial-gradient(circle,rgba(137,137,137,0.1)_0%,transparent_70%)]" />

          <div className="relative z-[1]">
            <div className="mb-8 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
                <Target size={18} color="black" />
              </div>
              <span className="font-[Outfit] text-lg font-extrabold tracking-[-0.03em]">Productivity Master</span>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(137,137,137,0.3)] bg-[rgba(137,137,137,0.15)] text-2xl font-black text-[#b6b6b6]">
                  {level}
                </div>
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.5)]">Level & Rank</p>
                  <p className="font-[Outfit] text-xl font-bold">{rank} Optimizer</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] p-4">
                  <Flame size={16} color="#a6a6a6" className="mb-2" />
                  <p className="font-[Outfit] text-2xl font-extrabold">{stats.bestStreak}<span className="ml-1 text-sm font-medium text-[rgba(255,255,255,0.4)]">days</span></p>
                  <p className="text-[11px] font-medium text-[rgba(255,255,255,0.5)]">Top Streak</p>
                </div>
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] p-4">
                  <Trophy size={16} color="var(--accent-primary)" className="mb-2" />
                  <p className="font-[Outfit] text-2xl font-extrabold">{stats.totalCompletions}</p>
                  <p className="text-[11px] font-medium text-[rgba(255,255,255,0.5)]">Total Habits</p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-[rgba(255,255,255,0.08)] pt-5 text-center">
              <p className="text-[11px] font-medium text-[rgba(255,255,255,0.4)]">Tracked at productivity-master.app</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-center text-[13px] text-text-secondary">
            Snapshot your progress or copy the summary below.
          </p>

          <div className="relative rounded-xl border border-border-subtle bg-bg-tertiary p-3.5 text-[13px] leading-[1.5] text-text-primary">
            {shareText}
          </div>

          <div className="flex gap-2.5">
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
