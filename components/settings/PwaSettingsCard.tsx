'use client';

import React from 'react';
import { Download, Share, SquarePlus, Sparkles, CheckCircle2, Trash2, X, Laptop, Smartphone, AlertCircle } from 'lucide-react';
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
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-slate-900/95 backdrop-blur-xl p-5 sm:p-6 text-white shadow-xl shadow-purple-950/30">
        {/* Decorative Background Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl" />

        {/* Card Content Header */}
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 p-0.5 shrink-0 shadow-lg shadow-purple-600/30">
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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-white tracking-tight m-0">Productivity Master</h3>
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-wider shrink-0">
                  APP
                </span>
                {isInstalled && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Installed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 m-0">Fast & easy habit tracking</p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative z-10 mt-4 pt-4 border-t border-slate-800/90">
          {isInstalled ? (
            /* INSTALLED STATE */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-slate-300 leading-relaxed m-0 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  App is installed and ready on your device.
                </p>
                <p className="text-[11px] text-slate-400 m-0">
                  Enjoy instant access, offline habit tracking, and full-screen productivity.
                </p>
              </div>

              <button
                onClick={openUninstallModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                           bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30
                           text-rose-300 hover:text-rose-200 font-semibold text-xs
                           transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Uninstall App
              </button>
            </div>
          ) : (
            /* NOT INSTALLED STATE */
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed m-0">
                Install our web app for instant access, offline support, and full-screen productivity.
              </p>

              {isIos ? (
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-slate-300 space-y-1.5">
                  <p className="font-semibold text-purple-300 flex items-center gap-1.5 m-0">
                    <Sparkles className="w-4 h-4 text-purple-400" /> How to install on iOS Safari:
                  </p>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed m-0">
                    Tap <Share className="w-3.5 h-3.5 inline mx-1 text-purple-400" /> <span className="font-semibold text-white">Share</span> in Safari toolbar, then select <SquarePlus className="w-3.5 h-3.5 inline mx-1 text-purple-400" /> <span className="font-semibold text-white">Add to Home Screen</span>.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleInstall}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                                 bg-gradient-to-r from-purple-600 to-indigo-600 
                                 hover:from-purple-500 hover:to-indigo-500 
                                 text-white font-semibold text-xs shadow-md shadow-purple-600/30
                                 active:scale-95 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Install App
                    </button>
                  </div>
                  {installMessage && (
                    <p className="text-[11px] text-purple-300 bg-purple-950/50 p-2.5 rounded-lg border border-purple-500/30 m-0 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {installMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UNINSTALL MODAL */}
      <AnimatePresence>
        {showUninstallModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-white"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="m-0 text-base font-bold text-white">Uninstall App</h3>
                    <p className="m-0 text-xs text-slate-400">Productivity Master PWA</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUninstallModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body - Platform specific instructions */}
              <div className="my-4 space-y-3.5">
                <p className="text-xs text-slate-300 leading-relaxed m-0">
                  Web apps (PWAs) are managed directly by your browser or operating system. Follow the steps below to remove the app from your device:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-1">
                    <p className="font-semibold text-purple-300 flex items-center gap-1.5 m-0">
                      <Laptop className="w-4 h-4" /> Chrome / Edge / Desktop:
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed m-0 pl-5">
                      Click the three-dots menu (<span className="font-bold text-white">⋮</span> or <span className="font-bold text-white">…</span>) in the top window title bar, then select <span className="font-semibold text-rose-300">"Uninstall Productivity Master…"</span>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-1">
                    <p className="font-semibold text-purple-300 flex items-center gap-1.5 m-0">
                      <Smartphone className="w-4 h-4" /> Android / iOS:
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed m-0 pl-5">
                      Touch & hold the app icon on your Home Screen or App Drawer, then tap <span className="font-semibold text-rose-300">Uninstall</span> or <span className="font-semibold text-rose-300">Remove App</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={markUninstalled}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                  title="Clears local installation status"
                >
                  Mark Uninstalled
                </button>
                <button
                  onClick={() => setShowUninstallModal(false)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
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
