import { SITE_URL } from './site';

/**
 * Centralized brand strings. The product name and logo are changing after launch —
 * new code should import from here rather than hardcoding, so the rename is a
 * one-file diff. Existing hardcoded occurrences are intentionally left alone.
 */
export const PRODUCT_NAME = 'MV Habits';
export const PRODUCT_TAGLINE = 'Build daily habits that actually stick';

// TODO(DECISIONS.md): Fill SUPPORT_EMAIL when decided in DECISIONS.md
export const SUPPORT_EMAIL = 'support@mv-habits.app';

// TODO(DECISIONS.md): Fill LEGAL_ENTITY when decided in DECISIONS.md
export const LEGAL_ENTITY = 'MV Habits';

export { SITE_URL };
