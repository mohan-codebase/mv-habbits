import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import TrustStrip from '@/components/landing/TrustStrip';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Pricing from '@/components/landing/Pricing';
import Faq from '@/components/landing/Faq';
import FinalCta from '@/components/landing/FinalCta';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Productivity Master — Build daily habits that actually stick',
  description: 'Track habits, keep streaks, and see the patterns behind your consistency. Free to start.',
  alternates: { canonical: '/' },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-primary/20 selection:text-accent-primary">
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
