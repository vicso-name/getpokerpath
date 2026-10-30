import { SITE_DESCRIPTION, SITE_NAME } from '../site/config';
import { absoluteUrl } from './meta';

export interface Crumb {
  label: string;
  path: string;
}

export function breadcrumbListSchema(crumbs: readonly Crumb[], site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: absoluteUrl(crumb.path, site),
    })),
  };
}

export function websiteSchema(site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: absoluteUrl('/', site),
  };
}

/** Serializes for an inline script tag, so copy can never close the tag early. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
