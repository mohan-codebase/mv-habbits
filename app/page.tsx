import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import TrustStrip from '@/components/landing/TrustStrip';

const Features = dynamic(() => import('@/components/landing/Features'));
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks'));
const Pricing = dynamic(() => import('@/components/landing/Pricing'));
const Faq = dynamic(() => import('@/components/landing/Faq'));
const FinalCta = dynamic(() => import('@/components/landing/FinalCta'));
const Footer = dynamic(() => import('@/components/landing/Footer'));

export const metadata: Metadata = {
  title: 'MV Habits — Build daily habits that actually stick',
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
