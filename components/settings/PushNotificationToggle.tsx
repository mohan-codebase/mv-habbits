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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-3.5 rounded-xl border border-border-subtle bg-bg-card py-4 px-[18px] shadow-none"
      >
        {/* Icon chip */}
        <div
          className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border ${c.toneClass} ${
            state === 'subscribed'
              ? 'border-border-accent bg-accent-glow-md'
              : 'border-border-subtle bg-bg-tertiary'
          }`}
        >
          {c.icon}
        </div>

        {/* Text + CTA */}
        <div className="min-w-0 flex-1">
          <div className="mb-[3px] flex items-center gap-2">
            <p className="m-0 text-[14px] font-bold text-text-primary">
              {c.title}
            </p>
            {state === 'subscribed' && (
              <CheckCircle2 size={13} color="var(--accent-primary)" />
            )}
          </div>
          <p className="m-0 mb-3 text-sm leading-[1.5] text-text-muted">
            {c.desc}
          </p>
          {c.cta && c.ctaFn && (
            <button
              onClick={c.ctaFn}
              className={`rounded-sm border px-3.5 py-[7px] text-[13px] font-semibold cursor-pointer [font-family:inherit] ${
                state === 'subscribed'
                  ? 'border-border-default bg-bg-tertiary text-text-secondary'
                  : 'border-transparent bg-accent-primary text-accent-on-primary'
              }`}
            >
              {c.cta}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
