import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import seoPages from '../../../data/seo-pages.json' with { type: 'json' };
import {
  LIVE_TOOL_IDS,
  getLinkableTools,
  getLiveTools,
  getToolsInDevelopment,
} from '../../lib/site/tools';

function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

/** Maps `src/pages/tools/index.astro` to `/tools/`. */
function routeFor(file: string): string {
  const path = relative('src/pages', file).split(sep).join('/').replace(/\.astro$/, '');
  return path === 'index' ? '/' : `/${path.replace(/\/?index$/, '')}/`;
}

describe('canonical URL map', () => {
  it('keeps the 15 approved pages with unique paths', () => {
    const paths = seoPages.pages.map((page) => page.path);
    expect(paths).toHaveLength(15);
    expect(new Set(paths).size).toBe(15);
    for (const path of paths) expect(path).toMatch(/^\/[a-z0-9-]+\/$/);
  });

  it('plans exactly P01, P05 and P09 for Wave 1', () => {
    const waveOne = seoPages.pages.filter((page) => page.publishInWave1).map((page) => page.id);
    expect(waveOne).toEqual(['P01', 'P05', 'P09']);
  });
});

describe('published routes', () => {
  it('only exist for Home, /tools/, 404 and live tools', () => {
    const routes = filesIn('src/pages').map(routeFor).sort();
    const expected = ['/', '/404/', '/tools/', ...getLiveTools().map((tool) => tool.path)].sort();
    expect(routes).toEqual(expected);
  });

  it('only mark a tool live when it is planned for this wave', () => {
    const planned = [...getLiveTools(), ...getToolsInDevelopment()].map((tool) => tool.id);
    for (const id of LIVE_TOOL_IDS) expect(planned).toContain(id);
  });
});

describe('tool registry', () => {
  it('has card copy for every Wave 1 tool', () => {
    for (const tool of [...getLiveTools(), ...getToolsInDevelopment()]) {
      expect(tool.summary).not.toBe('');
      expect(tool.navLabel.length).toBeLessThan(tool.name.length);
    }
  });

  it('refuses to link to unpublished tools', () => {
    const live = getLiveTools().map((tool) => tool.id);
    const linkable = getLinkableTools(['P01', 'P02', 'P05', 'P09', 'P15']).map((tool) => tool.id);
    expect(linkable).toEqual(live.filter((id) => ['P01', 'P05', 'P09'].includes(id)));
  });
});

describe('poker domain layer', () => {
  it('imports nothing outside itself, keeping it free of UI frameworks', () => {
    const imports = filesIn('src/lib/poker').flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]),
    );
    for (const specifier of imports) expect(specifier).toMatch(/^\.\//);
  });
});
