'use client';

import React from 'react';
import { Download, Share, SquarePlus, Sparkles, CheckCircle2, Trash2, X, Laptop, Smartphone, AlertCircle, Zap, WifiOff, MonitorCheck } from 'lucide-react';
import { usePwa } from '@/components/ui/PwaContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function PwaSettingsCard() {
  const {
    isInstalled,
    isStandalone,
    isIos,
    deferredPrompt,
    installApp,
    showUninstallModal,
    setShowUninstallModal,
    openUninstallModal,
    markUninstalled,
  } = usePwa();

  const [installMessage, setInstallMessage] = React.useState<string | null>(null);

  const handleInstall = async () => {
    if (isIos) return;
    if (deferredPrompt) {
      const success = await installApp();
      if (!success) {
        setInstallMessage('Prompt was cancelled or not accepted.');
      }
    } else {
      setInstallMessage('To install: click your browser menu (⋮ or ⊕) and select "Install Productivity Master".');
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] backdrop-blur-md p-5 sm:p-6 shadow-md transition-all">
        {/* Subtle Ambient Violet Glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#8B5CF6]/10 blur-3xl" />

        {/* Main Content Layout */}
        <div className="relative z-10 flex flex-col gap-5">
          {/* Header Row: Logo, Title, Badges */}
          <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6] p-0.5 shrink-0 shadow-accent flex items-center justify-center">
                <div className="w-full h-full bg-[var(--bg-primary)] rounded-[14px] flex items-center justify-center overflow-hidden">
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
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] font-['Outfit'] tracking-tight m-0">
                    Productivity Master
                  </h3>
                  <span className="bg-[#8B5CF6]/15 text-[#C4B5FD] dark:text-[#C4B5FD] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#8B5CF6]/30 uppercase tracking-wider shrink-0">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0 font-medium">
                  Fast, offline & standalone habit tracking app
                </p>
              </div>
            </div>

            {/* Status Pill Badge */}
            <div className="shrink-0">
              {isInstalled ? (
                <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Installed
                </span>
              ) : (
                <span className="bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#C4B5FD] text-xs font-semibold px-3 py-1 rounded-full border border-[#8B5CF6]/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Ready to Install
                </span>
              )}
            </div>
          </div>

          {/* Grid Layout: Left Column Features, Right Column Action Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left Column: App Benefits & Description */}
            <div className="md:col-span-7 space-y-3">
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Install our web app on your home screen or desktop for a native experience without app store downloads.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-tertiary)]/70 border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-medium">
                  <Zap className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <span>Instant Launch</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-tertiary)]/70 border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-medium">
                  <WifiOff className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <span>Offline Support</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-tertiary)]/70 border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-medium">
                  <MonitorCheck className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <span>Full Screen</span>
                </div>
              </div>
            </div>

            {/* Right Column: CTA Action Container */}
            <div className="md:col-span-5 flex flex-col justify-center items-stretch p-4 rounded-xl bg-[var(--bg-tertiary)]/60 border border-[var(--border-subtle)] gap-3">
              {isInstalled ? (
                <div className="flex flex-col gap-2.5 text-center sm:text-left">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>App is active on this device</span>
                  </div>
                  <button
                    onClick={openUninstallModal}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                               bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30
                               text-rose-600 dark:text-rose-400 font-semibold text-xs
                               transition-all cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Uninstall App
                  </button>
                </div>
              ) : isIos ? (
                <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  <p className="font-semibold text-[#8B5CF6] flex items-center gap-1.5 m-0">
                    <Sparkles className="w-4 h-4 text-[#8B5CF6]" /> How to install on iOS Safari:
                  </p>
                  <p className="text-[11.5px] leading-relaxed m-0">
                    Tap <Share className="w-3.5 h-3.5 inline mx-0.5 text-[#8B5CF6]" /> <span className="font-semibold text-[var(--text-primary)]">Share</span> in Safari, then tap <SquarePlus className="w-3.5 h-3.5 inline mx-0.5 text-[#8B5CF6]" /> <span className="font-semibold text-[var(--text-primary)]">Add to Home Screen</span>.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleInstall}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                               bg-[#8B5CF6] hover:bg-[#7C3AED] 
                               text-white font-bold text-xs sm:text-sm shadow-accent
                               active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Install Web App
                  </button>
                  {installMessage && (
                    <p className="text-[11px] text-[#8B5CF6] bg-[#8B5CF6]/10 p-2.5 rounded-lg border border-[#8B5CF6]/20 m-0 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {installMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* UNINSTALL MODAL */}
      <AnimatePresence>
        {showUninstallModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 shadow-2xl text-[var(--text-primary)]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="m-0 text-base font-bold text-[var(--text-primary)] font-['Outfit']">Uninstall App</h3>
                    <p className="m-0 text-xs text-[var(--text-muted)]">Productivity Master PWA</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUninstallModal(false)}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body - Platform specific instructions */}
              <div className="my-4 space-y-3.5">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0">
                  Web apps (PWAs) are managed directly by your browser or operating system. Follow the steps below to remove the app from your device:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-1">
                    <p className="font-semibold text-[#8B5CF6] flex items-center gap-1.5 m-0">
                      <Laptop className="w-4 h-4" /> Chrome / Edge / Desktop:
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed m-0 pl-5">
                      Click the three-dots menu (<span className="font-bold text-[var(--text-primary)]">⋮</span> or <span className="font-bold text-[var(--text-primary)]">…</span>) in the window title bar, then select <span className="font-semibold text-rose-500">&ldquo;Uninstall Productivity Master&hellip;&rdquo;</span>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-1">
                    <p className="font-semibold text-[#8B5CF6] flex items-center gap-1.5 m-0">
                      <Smartphone className="w-4 h-4" /> Android / iOS:
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed m-0 pl-5">
                      Touch & hold the app icon on your Home Screen, then tap <span className="font-semibold text-rose-500">Uninstall</span> or <span className="font-semibold text-rose-500">Remove App</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  onClick={markUninstalled}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                  title="Clears local installation status"
                >
                  Mark Uninstalled
                </button>
                <button
                  onClick={() => setShowUninstallModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
