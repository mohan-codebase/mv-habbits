'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * iPadOS 13+ reports a desktop Safari UA ("Macintosh"), so a plain
 * iPad|iPhone|iPod test misses every modern iPad. Touch points disambiguate:
 * real Macs report maxTouchPoints 0.
 */
function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isStandaloneMatch =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(Boolean(isStandaloneMatch));
    if (isStandaloneMatch) return;

    if (sessionStorage.getItem('pwa_prompt_dismissed')) return;

    // Safari never fires beforeinstallprompt, so iOS has no event to wait on —
    // surface the manual Add to Home Screen steps on a timer instead.
    const ios = detectIos();
    setIsIos(ios);

    if (ios) {
      const t = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(t);
    }

    let promptTimer: ReturnType<typeof setTimeout>;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing so the page has time to load first
      promptTimer = setTimeout(() => setShowPrompt(true), 2000);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(promptTimer);
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

  const visible = !isStandalone && showPrompt && !installed;

  // The banner is fixed, so it would sit on top of the page header. Reserve
  // exactly its height on <body> instead of guessing — the iOS copy wraps to
  // two lines on narrow screens, so the height is not a constant.
  useEffect(() => {
    const el = bannerRef.current;
    if (!visible || !el) return;

    const apply = () => {
      document.body.style.paddingTop = `${el.offsetHeight}px`;
    };
    apply();

    const observer = new ResizeObserver(apply);
    observer.observe(el);

    return () => {
      observer.disconnect();
      document.body.style.paddingTop = '';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    /* Slim banner pinned to the top of the viewport. Body padding above keeps
       it from overlapping page content. */
    <div
      ref={bannerRef}
      role="banner"
      aria-label="Install app prompt"
      className="fixed top-0 left-0 right-0 z-[200] flex items-center gap-3 px-4 py-2.5
                 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700
                 text-white text-xs
                 animate-in slide-in-from-top-2 duration-300"
      style={{ boxShadow: '0 2px 12px rgba(139,92,246,0.45)' }}
    >
      {/* Icon */}
      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
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

      {isIos ? (
        <>
          {/* iOS: no install event exists — show the manual steps inline. */}
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="font-semibold">Install Productivity Master:</span>
            <span className="inline-flex items-center gap-1 text-white/85">
              tap
              <Share className="w-3.5 h-3.5 shrink-0" aria-label="Share" />
              then
              <SquarePlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">Add to Home Screen</span>
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <span className="font-semibold truncate">Install Productivity Master</span>
            <span className="text-white/70 ml-1.5 hidden sm:inline">for quick access</span>
          </div>

          {/* Install button */}
          <button
            onClick={handleInstallClick}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       bg-white text-purple-700 font-bold text-[11px]
                       hover:bg-purple-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Install app"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        </>
      )}

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 text-white/70 hover:text-white transition-colors cursor-pointer"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
