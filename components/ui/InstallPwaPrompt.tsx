'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMatch =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMatch));
    };

    checkStandalone();

    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing so the page has time to load first
      setTimeout(() => setShowPrompt(true), 2000);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[PWA] Install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || !showPrompt || installed) return null;

  return (
    /* Slim banner pinned to very top of viewport — never overlaps content */
    <div
      role="banner"
      aria-label="Install app prompt"
      className="fixed top-0 left-0 right-0 z-[200] flex items-center gap-3 px-4 py-2.5
                 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700
                 text-white text-xs sm:hidden
                 animate-in slide-in-from-top-2 duration-300"
      style={{ boxShadow: '0 2px 12px rgba(139,92,246,0.45)' }}
    >
      {/* Icon */}
      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          className="w-full h-full rounded-[6px] object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span className="font-semibold truncate">Install Productivity Master</span>
        <span className="text-white/70 ml-1.5 hidden sm:inline">for quick access</span>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstallClick}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   bg-white text-purple-700 font-bold text-[11px]
                   hover:bg-purple-50 active:scale-95 transition-all cursor-pointer"
        aria-label="Install app"
      >
        <Download className="w-3.5 h-3.5" />
        Install
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 text-white/70 hover:text-white transition-colors cursor-pointer"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
