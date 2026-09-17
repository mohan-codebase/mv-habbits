import 'server-only';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const RP_NAME = 'MV Habits';
export const REG_CHALLENGE_COOKIE = 'wa_reg_chal';
export const AUTH_CHALLENGE_COOKIE = 'wa_auth_chal';
const CHALLENGE_TTL = 300; // seconds — a ceremony is short-lived

// Derive the Relying Party config from the request (or NEXT_PUBLIC_APP_URL
// when set). rpID is the bare hostname; origin is the full scheme://host.
// Works for localhost dev and the deployed domain without code changes.
export function getRelyingParty(req: NextRequest): { rpID: string; origin: string; rpName: string } {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  const headerOrigin = req.headers.get('origin');
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('host') ?? 'localhost:3000';
  const origin = envOrigin || headerOrigin || `${proto}://${host}`;
  const rpID = new URL(origin).hostname;
  return { rpID, origin, rpName: RP_NAME };
}

// Stash a ceremony challenge in a short-lived, httpOnly cookie so the
// matching verify step can confirm it (replay protection).
export async function setChallenge(name: string, challenge: string): Promise<void> {
  const store = await cookies();
  store.set(name, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CHALLENGE_TTL,
  });
}

// Read and immediately clear the challenge cookie (single use).
export async function takeChallenge(name: string): Promise<string | null> {
  const store = await cookies();
  const value = store.get(name)?.value ?? null;
  if (value) store.set(name, '', { path: '/', maxAge: 0 });
  return value;
}
