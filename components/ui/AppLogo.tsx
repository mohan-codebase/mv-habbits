'use client';

import Image from 'next/image';
import { useTier } from '@/lib/hooks/useTier';
import { TIER_KEY_SRC, type Tier } from '@/types/profile';

/**
 * The key mark.
 *
 * `tier="brand"` (default) is the product's fixed identity — always gold, and
 * what every static surface uses (favicon, install icon, OpenGraph). Passing an
 * explicit tier, or `useUserTier`, renders the signed-in user's finish instead:
 * silver for free, gold for premium.
 *
 * The previous version rendered BOTH a dark and a light image and hid one with
 * CSS, shipping ~5.3 MB of PNG on every page. The key mark reads on either
 * theme, so there is now a single image.
 */
export default function AppLogo({
  width = 32,
  height = 32,
  className = '',
  tier,
  useUserTier = false,
  priority = false,
}: {
  width?: number;
  height?: number;
  className?: string;
  tier?: Tier;
  useUserTier?: boolean;
  priority?: boolean;
}) {
  const { tier: userTier } = useTier();

  const resolved: Tier | 'brand' = tier ?? (useUserTier ? userTier : 'brand');
  const src = resolved === 'brand' ? '/logo/key-gold-128.png' : TIER_KEY_SRC[resolved];

  return (
    <div className={`hf-app-logo relative shrink-0 ${className}`} style={{ width, height }}>
      <Image
        src={src}
        alt="Productivity Master"
        fill
        className="object-contain"
        sizes={`${width}px`}
        priority={priority}
      />
    </div>
  );
}
