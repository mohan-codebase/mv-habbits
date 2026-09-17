/**
 * Server-side Web Push utility
 * Uses the `web-push` npm package with VAPID keys stored in env vars.
 *
 * Required env vars:
 *   VAPID_PUBLIC_KEY   — generate with: npx web-push generate-vapid-keys
 *   VAPID_PRIVATE_KEY  — (same command)
 *   VAPID_SUBJECT      — mailto:you@example.com or your site URL
 */

import webpush from 'web-push';

let initialised = false;

function initWebPush() {
  if (initialised) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  // TODO(DECISIONS.md): SUPPORT_EMAIL is unset, so this fallback still names a
  // domain this app is not served from. Push services use the VAPID subject to
  // contact the sender about a misbehaving endpoint — set VAPID_SUBJECT in
  // Vercel to a real mailto: you monitor, then delete this fallback.
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:hello@mv-habits.app';

  if (!pub || !priv) {
    // Gracefully degrade — push won't work, but nothing crashes
    console.warn('[webpush] VAPID keys not configured. Push notifications are disabled.');
    return;
  }

  webpush.setVapidDetails(subject, pub, priv);
  initialised = true;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }
): Promise<void> {
  initWebPush();
  if (!initialised) return; // VAPID not configured — skip silently

  await webpush.sendNotification(
    subscription as webpush.PushSubscription,
    JSON.stringify(payload)
  );
}

/** Exported so the subscribe API route can embed it in the page */
export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}
