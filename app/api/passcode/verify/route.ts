import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/utils/api';
import {
  verifyPasscode,
  checkVerifyRateLimit,
  recordVerifyFailure,
  clearVerifyRateLimit,
} from '@/lib/passcode';

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

// POST /api/passcode/verify — check a passcode against the stored hash,
// server-side. Protected with rate limiting against brute-force attacks.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err('Unauthorized', 401);

    // Check rate limit
    const rateLimit = checkVerifyRateLimit(user.id);
    if (!rateLimit.allowed) {
      return err(
        `Too many failed attempts. Locked out for ${rateLimit.retryAfterSeconds}s.`,
        429
      );
    }

    const body = await req.json().catch(() => null);
    const passcode = typeof body?.passcode === 'string' ? body.passcode : '';
    if (!passcode) return err('Passcode required', 422);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('habits_passcode')
      .eq('id', user.id)
      .maybeSingle();
    if (error) return err(safeErrorMessage(error, 'Failed to verify passcode'), 500);

    const verified = verifyPasscode(passcode, profile?.habits_passcode);

    if (verified) {
      clearVerifyRateLimit(user.id);
      return ok({ verified: true });
    } else {
      const { locked, attemptsLeft } = recordVerifyFailure(user.id);
      if (locked) {
        return err(
          'Incorrect passcode. Maximum attempts reached. Account locked for 15 minutes.',
          429
        );
      }
      return ok({ verified: false, attemptsLeft });
    }
  } catch (e) {
    return err(safeErrorMessage(e, 'Failed to verify passcode'), 500);
  }
}
