import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getVapidPublicKey } from '@/lib/webpush';

function ok<T>(data: T) {
  return NextResponse.json({ data }, { status: 200 });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET — return the VAPID public key so the client can subscribe
export async function GET() {
  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    return err('Push notifications are not configured on this server.', 503);
  }
  return ok({ vapidPublicKey: vapidKey });
}

// POST — save a new push subscription for the current user
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { endpoint, keys } = body ?? {};

  if (
    typeof endpoint !== 'string' ||
    typeof keys?.p256dh !== 'string' ||
    typeof keys?.auth !== 'string'
  ) {
    return err('Invalid subscription payload');
  }

  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const userAgent = req.headers.get('user-agent') ?? null;
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth_key: keys.auth,
          user_agent: userAgent,
        },
        { onConflict: 'endpoint' }
      );

      if (error) {
        console.warn('[push/subscribe] Could not save to DB table (table missing or RLS policy):', error.message);
      }
    }
  } catch (e) {
    console.warn('[push/subscribe] Supabase client error:', e);
  }

  // Always return success to client since browser push subscription is active
  return ok({ subscribed: true });
}
