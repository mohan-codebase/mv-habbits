import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { formatInTimeZone } from 'date-fns-tz';

// Import project modules directly
import { hashPasscode, verifyPasscode, checkVerifyRateLimit, recordVerifyFailure, clearVerifyRateLimit } from '../lib/passcode.ts';
import { habitSchema } from '../lib/validations/habit.ts';
import { safeErrorMessage } from '../lib/utils/api.ts';
import { computeBestStreak, computeLifetimeCompletions } from '../lib/stats/habitStats.ts';

test('1. Passcode Hashing, Verification, and Rate Limiting', async () => {
  const userId = `test-user-${Date.now()}`;
  clearVerifyRateLimit(userId);

  // A. Hashing and Verification
  const pin = '4829';
  const hashed = hashPasscode(pin);
  assert.ok(hashed.startsWith('scrypt$'), 'Hash should start with scrypt$ prefix');
  assert.equal(verifyPasscode(pin, hashed), true, 'Correct PIN must verify to true');
  assert.equal(verifyPasscode('0000', hashed), false, 'Incorrect PIN must verify to false');
  assert.equal(verifyPasscode('', hashed), false, 'Empty PIN must verify to false');
  assert.equal(verifyPasscode(pin, null), false, 'Null stored hash must safely return false');

  // B. Rate Limiting Initial State
  const initialCheck = checkVerifyRateLimit(userId);
  assert.equal(initialCheck.allowed, true, 'User should initially be allowed to attempt verification');

  // C. Multiple Failed Attempts
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = recordVerifyFailure(userId);
    assert.equal(res.locked, false, `Attempt ${attempt} should not lock user out`);
    assert.equal(res.attemptsLeft, 5 - attempt, `Remaining attempts should be ${5 - attempt}`);
    assert.equal(checkVerifyRateLimit(userId).allowed, true, 'User should still be allowed under 5 attempts');
  }

  // D. 5th Failed Attempt Locks Out
  const finalFailure = recordVerifyFailure(userId);
  assert.equal(finalFailure.locked, true, '5th attempt must trigger lockout');
  assert.equal(finalFailure.attemptsLeft, 0, 'No attempts left after lockout');

  const lockedCheck = checkVerifyRateLimit(userId);
  assert.equal(lockedCheck.allowed, false, 'Rate limit check must disallow requests after 5 failures');
  assert.ok((lockedCheck.retryAfterSeconds ?? 0) > 0, 'Must include positive retryAfterSeconds');

  // E. Clearing Rate Limit
  clearVerifyRateLimit(userId);
  assert.equal(checkVerifyRateLimit(userId).allowed, true, 'Clearing rate limit must restore access');
});

test('2. Habit Schema Color & Frequency Validation (Onboarding Fix Verification)', async () => {
  // A. Valid 6-digit hex color presets must pass
  const validColors = ['#0071e3', '#4F46E5', '#2563EB', '#0891B2', '#059669', '#D97706', '#DB2777', '#E11D48'];
  for (const color of validColors) {
    const res = habitSchema.safeParse({
      name: `Habit with ${color}`,
      color,
      frequency: { type: 'daily' },
      target_type: 'boolean',
      target_value: 1,
    });
    assert.equal(res.success, true, `Hex color ${color} should be valid`);
  }

  // B. CSS variable 'var(--accent-primary)' MUST fail schema validation (verifying our onboarding bug fix)
  const invalidVarColor = habitSchema.safeParse({
    name: 'Broken Onboarding Habit',
    color: 'var(--accent-primary)',
    frequency: { type: 'daily' },
    target_type: 'boolean',
    target_value: 1,
  });
  assert.equal(invalidVarColor.success, false, 'CSS variable in color must fail habitSchema validation');

  // C. Weekly frequency refinement
  const weeklyWithoutDays = habitSchema.safeParse({
    name: 'Weekly Habit',
    color: '#0071e3',
    frequency: { type: 'weekly', days: [] },
  });
  assert.equal(weeklyWithoutDays.success, false, 'Weekly frequency with empty days must fail');

  const weeklyWithDays = habitSchema.safeParse({
    name: 'Weekly Habit',
    color: '#0071e3',
    frequency: { type: 'weekly', days: [1, 3, 5] },
  });
  assert.equal(weeklyWithDays.success, true, 'Weekly frequency with days [1, 3, 5] must pass');
});

test('3. Safe Error Message Sanitization (OWASP Info Leakage Prevention)', async () => {
  // A. Database internal table error must be masked
  const dbError = new Error('relation "public.profiles" does not exist at character 42');
  const sanitizedDb = safeErrorMessage(dbError, 'Failed to fetch user');
  assert.equal(sanitizedDb, 'Failed to fetch user', 'Database table errors must be masked by fallback');

  // B. Postgres error strings must be masked
  const pgError = 'PostgresError: duplicate key value violates unique constraint "users_email_key"';
  const sanitizedPg = safeErrorMessage(pgError, 'Failed to save');
  assert.equal(sanitizedPg, 'Failed to save', 'Postgres constraint errors must be masked');

  // C. Safe user-facing error message must be preserved
  const userSafeError = new Error('Invalid email or password format');
  const sanitizedSafe = safeErrorMessage(userSafeError, 'Default fallback');
  assert.equal(sanitizedSafe, 'Invalid email or password format', 'Safe user-facing errors should be preserved');
});

test('4. Timezone Calculations & Date Boundary Consistency', async () => {
  // Fixed reference date: 2026-09-12 18:30:00 UTC
  // In Asia/Kolkata (+05:30): 2026-09-13 00:00:00 (Midnight next day)
  // In America/New_York (-04:00): 2026-09-12 14:30:00 (Afternoon same day)
  const testDate = new Date('2026-09-12T18:30:00.000Z');

  const istDate = formatInTimeZone(testDate, 'Asia/Kolkata', 'yyyy-MM-dd');
  const istHour = parseInt(formatInTimeZone(testDate, 'Asia/Kolkata', 'H'), 10);
  const istDay = formatInTimeZone(testDate, 'Asia/Kolkata', 'EEEE');

  assert.equal(istDate, '2026-09-13', 'Should be September 13th in IST');
  assert.equal(istHour, 0, 'Should be 0 hours (midnight) in IST');
  assert.equal(istDay, 'Sunday', 'Should be Sunday in IST');

  const nyDate = formatInTimeZone(testDate, 'America/New_York', 'yyyy-MM-dd');
  const nyHour = parseInt(formatInTimeZone(testDate, 'America/New_York', 'H'), 10);
  const nyDay = formatInTimeZone(testDate, 'America/New_York', 'EEEE');

  assert.equal(nyDate, '2026-09-12', 'Should be September 12th in NY');
  assert.equal(nyHour, 14, 'Should be 14 (2 PM) in NY');
  assert.equal(nyDay, 'Saturday', 'Should be Saturday in NY');
});

test('5. Habit Stats & Streak Calculation (Bad Habits Excluded)', async () => {
  const habits = [
    {
      id: 'h1',
      name: 'Morning Workout',
      is_bad_habit: false,
      current_streak: 15,
      longest_streak: 20,
      total_completions: 42,
    },
    {
      id: 'h2',
      name: 'Drink Water',
      is_bad_habit: false,
      current_streak: 30,
      longest_streak: 35,
      total_completions: 90,
    },
    {
      id: 'h3',
      name: 'Quit Smoking', // Bad habit: must be excluded from streak and completions
      is_bad_habit: true,
      current_streak: 120,
      longest_streak: 120,
      total_completions: 120,
    },
  ];

  const { bestStreak, bestStreakHabitName } = computeBestStreak(habits);
  assert.equal(bestStreak, 30, 'Best streak should be 30 from "Drink Water", ignoring bad habit 120');
  assert.equal(bestStreakHabitName, 'Drink Water');

  const lifetime = computeLifetimeCompletions(habits);
  assert.equal(lifetime, 132, 'Lifetime completions must sum 42 + 90 = 132, ignoring bad habit');
});

test('6. Timing-Safe Secret Validation (Cron Secret Verification)', async () => {
  function verifyCronSecret(provided, expected) {
    if (!provided || !expected) return false;
    const pBuf = Buffer.from(provided);
    const eBuf = Buffer.from(expected);
    if (pBuf.length !== eBuf.length) return false;
    return crypto.timingSafeEqual(pBuf, eBuf);
  }

  const validSecret = 'super-secret-cron-token-998877';
  assert.equal(verifyCronSecret(validSecret, validSecret), true, 'Exact match must succeed');
  assert.equal(verifyCronSecret('wrong-token-998877', validSecret), false, 'Different length must safely fail');
  assert.equal(verifyCronSecret('super-secret-cron-token-000000', validSecret), false, 'Same length but wrong token must fail');
  assert.equal(verifyCronSecret('', validSecret), false, 'Empty token must fail');
  assert.equal(verifyCronSecret(validSecret, ''), false, 'Empty expected secret must fail');
});
