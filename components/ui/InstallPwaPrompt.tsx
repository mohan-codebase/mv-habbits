'use client';

import { Download, Share, SquarePlus, X, Sparkles } from 'lucide-react';
import { usePwa } from '@/components/ui/PwaContext';

export default function InstallPwaPrompt() {
  const {
    showFloatingPrompt,
    dismissFloatingPrompt,
    installApp,
    isIos,
    isStandalone,
    isInstalled,
    deferredPrompt,
  } = usePwa();

  const visible = !isStandalone && showFloatingPrompt && !isInstalled;

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install App"
      className="fixed bottom-[5.5rem] lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[250] 
                 w-auto sm:w-80 max-w-[calc(100%-2rem)] p-4 
                 bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 
                 rounded-2xl shadow-2xl shadow-purple-950/50 text-white 
                 animate-in fade-in slide-in-from-bottom-5 duration-300 transition-all"
    >
      {/* Header with App Logo, Title, and Close Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6] p-0.5 shrink-0 shadow-lg shadow-purple-600/30">
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-semibold text-sm text-white truncate">Productivity Master</h4>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30 uppercase tracking-wider shrink-0">
                APP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">Fast & easy habit tracking</p>
          </div>
        </div>

        <button
          onClick={dismissFloatingPrompt}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
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
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={installApp}
                disabled={!deferredPrompt}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                           bg-[#8B5CF6] hover:bg-[#7C3AED] 
                           disabled:opacity-60 disabled:cursor-not-allowed
                           text-white font-medium text-xs shadow-accent
                           active:scale-95 transition-all cursor-pointer min-w-[120px]"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
              <button
                onClick={dismissFloatingPrompt}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
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
