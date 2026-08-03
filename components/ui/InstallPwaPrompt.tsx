'use client';

import { useState, useEffect } from 'react';
import { Download, Share, SquarePlus, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

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

  useEffect(() => {
    const isStandaloneMatch =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(Boolean(isStandaloneMatch));
    if (isStandaloneMatch) return;

    if (sessionStorage.getItem('pwa_prompt_dismissed')) return;

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

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install App"
      className="fixed bottom-5 right-5 z-[200] w-[calc(100%-2.5rem)] sm:w-80 p-4 
                 bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 
                 rounded-2xl shadow-2xl shadow-purple-950/50 text-white 
                 animate-in fade-in slide-in-from-bottom-5 duration-300 transition-all"
    >
      {/* Header with App Logo, Title, and Close Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 p-0.5 shrink-0 shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192.png"
                alt="Productivity Master Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-sm text-white">Productivity Master</h4>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30 uppercase tracking-wider">
                APP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Fast & easy habit tracking</p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="Close prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        {isIos ? (
          <div className="text-xs text-slate-300 space-y-1.5">
            <p className="font-medium text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Install on iOS:
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tap <Share className="w-3 h-3 inline mx-0.5 text-purple-400" /> Share in Safari, then select <SquarePlus className="w-3 h-3 inline mx-0.5 text-purple-400" /> <span className="font-medium text-slate-200">Add to Home Screen</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Install our web app for instant access, offline support, and full-screen productivity.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                           bg-gradient-to-r from-purple-600 to-indigo-600 
                           hover:from-purple-500 hover:to-indigo-500 
                           text-white font-medium text-xs shadow-md shadow-purple-600/20
                           active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

