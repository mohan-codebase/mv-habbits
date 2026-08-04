'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

interface PwaContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  showFloatingPrompt: boolean;
  isStandalone: boolean;
  isIos: boolean;
  isInstalled: boolean;
  dismissFloatingPrompt: () => void;
  installApp: () => Promise<boolean>;
  showUninstallModal: boolean;
  setShowUninstallModal: (open: boolean) => void;
  openUninstallModal: () => void;
  markUninstalled: () => void;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showFloatingPrompt, setShowFloatingPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showUninstallModal, setShowUninstallModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandaloneMatch =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(Boolean(isStandaloneMatch));

    const savedInstalled = localStorage.getItem('pwa_installed') === 'true';
    if (isStandaloneMatch || savedInstalled) {
      setIsInstalled(true);
    }

    const ios = detectIos();
    setIsIos(ios);

    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed') === 'true';

    if (ios && !isStandaloneMatch && !savedInstalled) {
      if (!dismissed) {
        const t = setTimeout(() => setShowFloatingPrompt(true), 2000);
        return () => clearTimeout(t);
      }
      return;
    }

    let promptTimer: ReturnType<typeof setTimeout>;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed && !isStandaloneMatch && !savedInstalled) {
        promptTimer = setTimeout(() => setShowFloatingPrompt(true), 2000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowFloatingPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(promptTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismissFloatingPrompt = useCallback(() => {
    setShowFloatingPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setShowFloatingPrompt(false);
        localStorage.setItem('pwa_installed', 'true');
        setDeferredPrompt(null);
        return true;
      }
      setDeferredPrompt(null);
      return false;
    } catch (err) {
      console.warn('[PWA] Install prompt error:', err);
      return false;
    }
  }, [deferredPrompt]);

  const openUninstallModal = useCallback(() => {
    setShowUninstallModal(true);
  }, []);

  const markUninstalled = useCallback(() => {
    setIsInstalled(false);
    localStorage.removeItem('pwa_installed');
    setShowUninstallModal(false);
  }, []);

  return (
    <PwaContext.Provider
      value={{
        deferredPrompt,
        showFloatingPrompt,
        isStandalone,
        isIos,
        isInstalled,
        dismissFloatingPrompt,
        installApp,
        showUninstallModal,
        setShowUninstallModal,
        openUninstallModal,
        markUninstalled,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    return {
      deferredPrompt: null,
      showFloatingPrompt: false,
      isStandalone: false,
      isIos: false,
      isInstalled: false,
      dismissFloatingPrompt: () => {},
      installApp: async () => false,
      showUninstallModal: false,
      setShowUninstallModal: () => {},
      openUninstallModal: () => {},
      markUninstalled: () => {},
    };
  }
  return context;
}
