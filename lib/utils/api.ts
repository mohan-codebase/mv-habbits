/**
 * Safe public-facing error message.
 *
 * In dev, surfaces the underlying message to make debugging easier.
 * In prod, returns the provided fallback so we don't leak DB / stack details.
 */
export function safeErrorMessage(e: unknown, fallback = 'Something went wrong'): string {
  if (process.env.NODE_ENV !== 'production') {
    const raw = e && typeof e === 'object' && 'message' in e
      ? String((e as { message: unknown }).message)
      : String(e);

    // Prevent sensitive DB schema/credential leakage even in dev/test
    if (/relation ".*" does not exist|syntax error at or near|password authentication failed|pg_|psql|select .* from|postgres|duplicate key|violates.*constraint|foreign key/i.test(raw)) {
      return fallback;
    }
    return raw;
  }
  return fallback;
}
