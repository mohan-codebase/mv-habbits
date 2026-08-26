import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Replaces the former public/robots.txt, which hardcoded a Sitemap line
// pointing at a domain this app is not served from. A static file cannot read
// env vars; this route can, so the sitemap URL now follows the deployment.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
