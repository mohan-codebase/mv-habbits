// Single source of truth for this deployment's public origin.
//
// Before doc 01/B6 three different origins were hardcoded across the codebase
// (app/layout.tsx, app/sitemap.ts, public/robots.txt), so canonical tags,
// sitemap entries, and OG URLs disagreed with each other and search engines
// indexed whichever they hit first.
//
// Set NEXT_PUBLIC_SITE_URL in Vercel per-environment:
//   Production → https://{{DOMAIN}}
//   Preview    → the preview deployment URL
// The localhost fallback exists only so `npm run dev` and `npm run build` work
// on a machine with no env file. It must never be what production serves.

const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function resolveSiteUrl(): string {
  if (!RAW_SITE_URL) return 'http://localhost:3000';
  try {
    // Normalises away a trailing slash so `${SITE_URL}${route}` never doubles up.
    return new URL(RAW_SITE_URL).origin;
  } catch {
    console.warn(
      `[site] NEXT_PUBLIC_SITE_URL is not a valid URL (${RAW_SITE_URL}) — falling back to localhost.`
    );
    return 'http://localhost:3000';
  }
}

export const SITE_URL = resolveSiteUrl();

/** Bare host, e.g. "example.com" — for display in UI, not for linking. */
export const SITE_HOST = new URL(SITE_URL).host;
