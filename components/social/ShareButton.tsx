'use client';

import React from 'react';
import { Share2, Twitter } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  type?: 'twitter' | 'native';
  className?: string;
}

export default function ShareButton({ title, text, url = '', type = 'native', className = '' }: ShareButtonProps) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${text} ${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = new URL('https://twitter.com/intent/tweet');
    twitterUrl.searchParams.set('text', text);
    twitterUrl.searchParams.set('url', shareUrl);
    window.open(twitterUrl.toString(), '_blank');
  };

  if (type === 'twitter') {
    return (
      <button 
        onClick={handleTwitterShare}
        className={`flex items-center gap-2 px-3 py-1.5 bg-[#1da1f2] hover:bg-[#1a91da] text-white rounded-lg transition-colors text-sm font-medium ${className}`}
        aria-label="Share on Twitter"
      >
        <Twitter size={16} />
        Tweet
      </button>
    );
  }

  return (
    <button 
      onClick={handleNativeShare}
      className={`flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium ${className}`}
      aria-label="Share"
    >
      <Share2 size={16} />
      Share
    </button>
  );
}
