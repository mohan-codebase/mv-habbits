import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

// Content-Security-Policy — strict in prod, relaxed in dev for Next/Turbopack
// inline scripts + HMR. This was previously defined but never returned from
// headers(), leaving the app without any CSP at all.
const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline' is needed for Next/Tailwind injected styles + the theme
  // bootstrap script in app/layout.tsx. Tighten by adopting nonces if/when
  // the inline footprint is reduced.
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''}`.trim(),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  // ws:/wss: only needed in dev for HMR
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://fonts.googleapis.com https://vitals.vercel-insights.com${isDev ? ' ws: wss: http://localhost:*' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

// Cache-Control for public assets.
// Next.js owns /_next/static caching and warns when it is overridden.
const cacheControlHeaders = [
  // Static public assets (images, fonts, etc.)
  {
    source: '/:path*.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
    ],
  },
];

const nextConfig: NextConfig = {
  // CI guard re-enabled: typecheck failures now block production builds.
  // Run `npm run lint` as a separate CI step (Next 16 dropped the integrated
  // `eslint` config block — `next build` no longer runs ESLint inline).
  typescript: {
    ignoreBuildErrors: false,
  },

  // Next.js 16 Cache Components — disabled. The app's routes do request-time
  // dynamic IO (Supabase auth / cookies in layouts and pages) without wrapping
  // it in Suspense / `'use cache'`, which Cache Components requires. With it on,
  // dynamic routes (e.g. every /trip and /dashboard subpage) got stuck in a
  // ~1Hz client re-mount loop: pages rendered blank and tab navigation never
  // committed ("tabs not going in"). No route uses the `'use cache'` directive,
  // so enabling it bought nothing. Re-enable only after adding Suspense
  // boundaries around the dynamic auth reads.
  // cacheComponents: true,

  // Hide the on-screen dev indicator (the floating "Cache disabled" pill) — it's
  // fixed-positioned and overlaps page content on small viewports. Build/runtime
  // errors are still surfaced by Next.js regardless of this setting.
  devIndicators: false,

  // Tree-shake unused exports from large packages
  // Note: optimizePackageImports was removed in Next.js 16 - use package.json imports field or next.config.js instead
  // For now, we rely on Next.js built-in tree-shaking

  // Server external packages — keep Supabase out of the client bundle
  serverExternalPackages: [],

  // Compression — gzip + brotli for production
  compress: true,

  // Powered-by header — remove for security
  poweredByHeader: false,

  // React strict mode — keep enabled in dev for catching bugs.
  reactStrictMode: true,

  // Image optimization
  images: {
    // Use Vercel's CDN for image optimization
    formats: ['image/avif', 'image/webp'],
    // Remote patterns for external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com',
      },
    ],
  },

  // Headers — security + cache control.
  // The aggressive (immutable) static-asset cache headers are production-only:
  // applying them in dev makes the browser serve stale /_next/static chunks
  // after edits, which Next.js warns about and breaks HMR/refresh behavior.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      ...(isDev ? [] : cacheControlHeaders),
    ];
  },

  // Redirects — canonical URLs
  async redirects() {
    return [
      // Redirect /dashboard/ to /dashboard (trailing slash consistency)
      {
        source: '/dashboard/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Silence turbopack workspace root warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
