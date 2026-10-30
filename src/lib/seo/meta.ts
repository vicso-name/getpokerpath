import { SITE_NAME } from '../site/config';

export interface SeoInput {
  /** Page title without the brand suffix. */
  title: string;
  description: string;
  /** Site-relative path with a trailing slash. Omit on pages with no canonical URL. */
  path?: string;
  /** Configured site origin; canonical and og:url are skipped without one. */
  site?: URL;
  noindex?: boolean;
  ogType?: 'website' | 'article';
  /** Use the title as written, for the homepage. */
  bareTitle?: boolean;
}

export interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  robots?: string;
  ogType: 'website' | 'article';
}

/** Resolves a site-relative path against the configured origin. */
export function absoluteUrl(path: string, site: URL): string {
  return new URL(path, site).href;
}

/** Fails the build on metadata that would otherwise ship silently broken. */
export function buildSeoMeta(input: SeoInput): SeoMeta {
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) throw new Error('SEO title must not be empty');
  if (!description) throw new Error(`SEO description must not be empty ("${title}")`);
  if (input.path !== undefined && !/^\/(.*\/)?$/.test(input.path)) {
    throw new Error(`SEO path must start and end with "/": ${input.path}`);
  }

  return {
    title: input.bareTitle ? title : `${title} | ${SITE_NAME}`,
    description,
    canonical:
      input.path !== undefined && input.site ? absoluteUrl(input.path, input.site) : undefined,
    robots: input.noindex ? 'noindex, follow' : undefined,
    ogType: input.ogType ?? 'website',
  };
}
