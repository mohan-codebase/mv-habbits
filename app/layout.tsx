import type { Metadata, Viewport } from "next";
import { Inter, Outfit, IBM_Plex_Mono } from 'next/font/google';
import "./globals.css";
import AppProviders from "@/components/ui/AppProviders";
import ServiceWorkerRegistrar from "@/components/ui/ServiceWorkerRegistrar";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  metadataBase: new URL("https://productivity-master-eight.vercel.app"),
  title: "Productivity Master — Build daily habits that actually stick",
  description: "Premium habit tracker for routines, streaks, and self-growth. Track, analyze, and stay consistent — beautifully.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Productivity Master",
    description: "Premium habit tracker for routines, streaks, and self-growth.",
    type: "website",
    url: "https://productivity-master-eight.vercel.app",
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
        <script
          // Prevent flash of wrong theme — runs before paint.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;var la='#8B5CF6';document.documentElement.style.setProperty('--accent-primary',la);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <Suspense fallback={<ProvidersFallback />}>
          <AppProviders>{children}</AppProviders>
        </Suspense>
        <ServiceWorkerRegistrar />
        <SpeedInsights />
      </body>
    </html>
  );
}
