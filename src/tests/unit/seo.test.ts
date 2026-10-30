import { describe, expect, it } from 'vitest';
import { absoluteUrl, buildSeoMeta } from '../../lib/seo/meta';
import {
  breadcrumbListSchema,
  serializeJsonLd,
  websiteSchema,
} from '../../lib/seo/structuredData';

const site = new URL('https://example.test');
const base = { title: 'Pot Odds', description: 'How to price a call.', path: '/tools/', site };

describe('buildSeoMeta', () => {
  it('appends the brand and derives the canonical from the site origin', () => {
    const meta = buildSeoMeta(base);
    expect(meta.title).toBe('Pot Odds | GetPokerPath');
    expect(meta.canonical).toBe('https://example.test/tools/');
    expect(meta.robots).toBeUndefined();
    expect(meta.ogType).toBe('website');
  });

  it('leaves a bare title untouched', () => {
    expect(buildSeoMeta({ ...base, bareTitle: true }).title).toBe('Pot Odds');
  });

  it('builds the homepage canonical', () => {
    expect(buildSeoMeta({ ...base, path: '/' }).canonical).toBe('https://example.test/');
  });

  it('omits the canonical without a site or without a path', () => {
    expect(buildSeoMeta({ ...base, site: undefined }).canonical).toBeUndefined();
    expect(buildSeoMeta({ ...base, path: undefined }).canonical).toBeUndefined();
  });

  it('marks noindex pages', () => {
    expect(buildSeoMeta({ ...base, noindex: true }).robots).toBe('noindex, follow');
  });

  it('rejects empty metadata', () => {
    expect(() => buildSeoMeta({ ...base, title: '  ' })).toThrow(/title/);
    expect(() => buildSeoMeta({ ...base, description: '' })).toThrow(/description/);
  });

  it.each(['tools', '/tools', 'tools/', '/tools/page'])('rejects the path %s', (path) => {
    expect(() => buildSeoMeta({ ...base, path })).toThrow(/path/);
  });
});

describe('structured data', () => {
  it('numbers breadcrumbs in order with absolute URLs', () => {
    const schema = breadcrumbListSchema(
      [
        { label: 'Home', path: '/' },
        { label: 'Tools', path: '/tools/' },
      ],
      site,
    );
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.test/' },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://example.test/tools/' },
    ]);
  });

  it('describes the site without ratings or other unverifiable claims', () => {
    const schema = websiteSchema(site);
    expect(schema['@type']).toBe('WebSite');
    expect(schema.url).toBe(absoluteUrl('/', site));
    expect(JSON.stringify(schema)).not.toMatch(/rating|review/i);
  });

  it('escapes markup so copy cannot close the script tag', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script>');
  });
});
