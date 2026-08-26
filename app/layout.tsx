import type { Metadata, Viewport } from "next";
import { Inter, Outfit, IBM_Plex_Mono } from 'next/font/google';
import "./globals.css";
import AppProviders from "@/components/ui/AppProviders";
import ServiceWorkerRegistrar from "@/components/ui/ServiceWorkerRegistrar";
import InstallPwaPrompt from "@/components/ui/InstallPwaPrompt";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Productivity Master — Build daily habits that actually stick",
  description: "Premium habit tracker for routines, streaks, and self-growth. Track, analyze, and stay consistent — beautifully.",
  manifest: "/manifest.json",
  // No `icons` block on purpose. Next's file convention picks up app/icon.png
  // and app/apple-icon.png automatically, and an explicit block here overrides
  // it — which previously pointed the browser tab at the PWA install icon. That
  // one has an opaque dark background (right for a home screen, wrong for a tab,
  // where it reads as a dark sticker on a light tab strip). app/icon.png is
  // transparent and sits correctly on either.
  openGraph: {
    title: "Productivity Master",
    description: "Premium habit tracker for routines, streaks, and self-growth.",
    type: "website",
    url: SITE_URL,
    siteName: "Productivity Master",
  },
  twitter: {
    card: "summary_large_image",
    title: "Productivity Master",
    description: "Premium habit tracker for routines, streaks, and self-growth.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Productivity Master",
    startupImage: ["/icons/icon-512.png"],
  },
  other: {
    // Next emits the standardized `mobile-web-app-capable` for appleWebApp.capable.
    // iOS 16.4+ honours the manifest's `display: standalone`, but 16.3 and older
    // only read this legacy tag — without it they open in Safari chrome instead
    // of standalone after Add to Home Screen.
    "apple-mobile-web-app-capable": "yes",
  },
};

// NOTE: maximumScale/userScalable=false breaks pinch-zoom for low-vision users
// and is a WCAG 1.4.4 violation. Default initialScale=1 is enough — we don't
// need to lock zoom for a habit tracker.
export const viewport: Viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
};

import { Suspense } from 'react';

function ProvidersFallback() {
  return null; // Minimal fallback for providers
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full">
        <Suspense fallback={<ProvidersFallback />}>
          <AppProviders>
            {children}
            <InstallPwaPrompt />
          </AppProviders>
        </Suspense>
        <ServiceWorkerRegistrar />
        <SpeedInsights />
      </body>
    </html>
  );
}

