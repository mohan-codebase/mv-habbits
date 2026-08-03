'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, BellRing, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type State = 'idle' | 'requesting' | 'subscribed' | 'denied' | 'unsupported' | 'error';

/** Convert a base64url VAPID key to a plain ArrayBuffer for the browser Push API */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
  return arr.buffer as ArrayBuffer;
}

interface Props {
  /** Compact variant for embedding in the Topbar */
  compact?: boolean;
}

export default function PushNotificationToggle({ compact = false }: Props) {
  const [state, setState] = useState<State>('idle');
  const [endpoint, setEndpoint] = useState<string | null>(null);

  // ── Check current permission + existing subscription on mount ──────────
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setState('subscribed');
        setEndpoint(existing.endpoint);
      }
    });
  }, []);

  // ── Subscribe ──────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    setState('requesting');

    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }

      // 2. Fetch VAPID public key from our API
      const keyRes = await fetch('/api/push/subscribe');
      if (!keyRes.ok) {
        // Server not configured — show graceful UI
        setState('error');
        return;
      }
      const { data } = await keyRes.json();
      const vapidPublicKey: string = data.vapidPublicKey;

      // 3. Register / get the service worker and subscribe
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 4. Send the subscription to our API
      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });

      if (!saveRes.ok) throw new Error('Failed to save subscription');

      setEndpoint(subJson.endpoint);
      setState('subscribed');
    } catch (e) {
      console.error('[PushToggle] subscribe error:', e);
      setState('error');
    }
  }, []);

  // ── Unsubscribe ────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!endpoint) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await sub?.unsubscribe();

      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });

      setEndpoint(null);
      setState('idle');
    } catch (e) {
      console.error('[PushToggle] unsubscribe error:', e);
    }
  }, [endpoint]);

  // ── Compact pill variant (Topbar) ─────────────────────────────────────
  if (compact) {
    if (state === 'unsupported') return null;

    const isOn = state === 'subscribed';
    return (
      <button
        onClick={isOn ? unsubscribe : subscribe}
        disabled={state === 'requesting'}
        aria-label={isOn ? 'Disable push notifications' : 'Enable push notifications'}
        title={isOn ? 'Notifications on — click to disable' : 'Enable habit reminders'}
        className={`relative flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border transition-all duration-150 ${
          isOn
            ? 'border-border-accent bg-accent-glow text-accent-primary'
            : 'border-border-default bg-bg-tertiary text-text-secondary'
        } ${state === 'requesting' ? 'cursor-wait' : 'cursor-pointer'}`}
      >
        {state === 'requesting'
          ? <Loader2 size={15} className="spin" />
          : isOn
          ? <BellRing size={15} />
          : <Bell size={15} />}

        {/* Live dot when subscribed */}
        {isOn && (
          <span className="glow-pulse absolute top-[5px] right-[5px] h-1.5 w-1.5 rounded-full bg-accent-primary" />
        )}
      </button>
    );
  }

  // ── Full card variant (Settings page) ────────────────────────────────
  const config: Record<State, { icon: React.ReactNode; title: string; desc: string; cta?: string; ctaFn?: () => void; toneClass: string }> = {
    idle: {
      icon: <Bell size={18} />,
      title: 'Enable push notifications',
      desc: 'Get reminders when it\'s time to check in on your habits.',
      cta: 'Turn on notifications',
      ctaFn: subscribe,
      toneClass: 'text-accent-primary',
    },
    requesting: {
      icon: <Loader2 size={18} className="spin" />,
      title: 'Requesting permission…',
      desc: 'Check your browser\'s permission prompt.',
      toneClass: 'text-text-muted',
    },
    subscribed: {
      icon: <BellRing size={18} />,
      title: 'Notifications active',
      desc: 'You\'ll receive reminders at your habit\'s scheduled time.',
      cta: 'Turn off',
      ctaFn: unsubscribe,
      toneClass: 'text-accent-primary',
    },
    denied: {
      icon: <BellOff size={18} />,
      title: 'Notifications blocked',
      desc: 'You\'ve blocked notifications for this site. Re-enable them in your browser settings.',
      toneClass: 'text-danger',
    },
    unsupported: {
      icon: <BellOff size={18} />,
      title: 'Not supported',
      desc: 'Your browser doesn\'t support push notifications. Try Chrome or Edge.',
      toneClass: 'text-text-muted',
    },
    error: {
      icon: <AlertCircle size={18} />,
      title: 'Could not enable notifications',
      desc: 'Push notifications require VAPID keys to be configured on the server.',
      cta: 'Try again',
      ctaFn: subscribe,
      toneClass: 'text-warm',
    },
  };

  const c = config[state];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-bg-tertiary/40"
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-tertiary text-text-primary">
            {c.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="m-0 text-sm font-bold text-text-primary">{c.title}</p>
              {state === 'subscribed' && (
                <span className="rounded-full bg-accent-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-primary border border-accent-primary/30">
                  Active
                </span>
              )}
            </div>
            <p className="m-0 text-xs text-text-muted mt-0.5">{c.desc}</p>
          </div>
        </div>

        {c.cta && c.ctaFn && (
          <button
            onClick={c.ctaFn}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition-all shrink-0 ${
              state === 'subscribed'
                ? 'border border-border-default bg-bg-tertiary text-text-primary hover:border-danger hover:text-danger'
                : 'bg-accent-primary text-accent-on-primary border-none shadow-sm'
            }`}
          >
            {c.cta}
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
