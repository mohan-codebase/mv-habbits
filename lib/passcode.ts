import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// The habit-lock passcode is stored as a salted scrypt hash rather than
// plaintext. Format: "scrypt$<saltBase64url>$<hashBase64url>".
//
// Note: a short numeric PIN is inherently low-entropy, so this mainly
// removes the plaintext-at-rest problem (DB dumps, localStorage) — it is
// not a defense against an offline brute force of a 4-digit code. The lock
// is a soft gate on the user's own data, so that trade-off is acceptable.
const PREFIX = 'scrypt';
const KEYLEN = 64;
const SALT_BYTES = 16;

export function hashPasscode(plain: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(plain, salt, KEYLEN);
  return `${PREFIX}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPasscode(plain: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.startsWith(`${PREFIX}$`)) return false;
  const [, saltB64, hashB64] = stored.split('$');
  if (!saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, 'base64url');
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = scryptSync(plain, salt, expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

// Failed verification attempt tracking: max 5 attempts within 15 minutes
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number;
}

const verifyAttempts = new Map<string, RateLimitRecord>();

export function checkVerifyRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = verifyAttempts.get(userId);
  if (!record) return { allowed: true };

  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Lock expired
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    verifyAttempts.delete(userId);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordVerifyFailure(userId: string): { locked: boolean; attemptsLeft: number } {
  const now = Date.now();
  const record = verifyAttempts.get(userId) ?? { attempts: 0, lockedUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minute lockout
    verifyAttempts.set(userId, record);
    return { locked: true, attemptsLeft: 0 };
  }

  verifyAttempts.set(userId, record);
  return { locked: false, attemptsLeft: 5 - record.attempts };
}

export function clearVerifyRateLimit(userId: string): void {
  verifyAttempts.delete(userId);
}

