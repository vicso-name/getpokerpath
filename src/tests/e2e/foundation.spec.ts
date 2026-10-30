import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import seoPages from '../../../data/seo-pages.json' with { type: 'json' };
import { LIVE_TOOL_IDS } from '../../lib/site/tools';

const ORIGIN = 'https://getpokerpath.com';

const pages = [
  { path: '/', indexable: true },
  { path: '/tools/', indexable: LIVE_TOOL_IDS.length > 0 },
];

async function internalLinks(page: Page): Promise<string[]> {
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
  return [...new Set(hrefs.map((href) => href.split('#')[0]))];
}

for (const { path, indexable } of pages) {
  test.describe(`page ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test('has structurally correct SEO metadata', async ({ page }) => {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page).toHaveTitle(/GetPokerPath/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length).toBeGreaterThan(50);

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${ORIGIN}${path}`);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${ORIGIN}${path}`);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', await page.title());

      const robots = page.locator('meta[name="robots"]');
      if (indexable) await expect(robots).toHaveCount(0);
      else await expect(robots).toHaveAttribute('content', /noindex/);

      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(jsonLd.length).toBeGreaterThan(0);
      for (const block of jsonLd) expect(JSON.parse(block)['@context']).toBe('https://schema.org');
    });

    test('renders useful HTML without JavaScript', async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const noJsPage = await context.newPage();
      await noJsPage.goto(path);
      await expect(noJsPage.locator('h1')).toBeVisible();
      await expect(noJsPage.locator('main')).toContainText('Poker Hand Rankings Explorer');
      await context.close();
    });

    test('has no accessibility violations', async ({ page }) => {
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.map((violation) => violation.id)).toEqual([]);
    });

    test('does not overflow horizontally', async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('only links to routes that exist', async ({ page }) => {
      for (const href of await internalLinks(page)) {
        const response = await page.request.get(href);
        expect(response.status(), href).toBe(200);
      }
    });

    test('offers a working skip link as the first tab stop', async ({ page }) => {
      await page.keyboard.press('Tab');
      const skipLink = page.getByRole('link', { name: 'Skip to main content' });
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toBeInViewport();
      await page.keyboard.press('Enter');
      await expect(page.locator('main')).toBeFocused();
    });
  });
}

test('every planned tool route stays unpublished until it is live', async ({ request }) => {
  const unpublished = seoPages.pages.filter((page) => !LIVE_TOOL_IDS.includes(page.id));
  for (const { path } of unpublished) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test('home and tools have distinct titles and descriptions', async ({ page }) => {
  const meta = [];
  for (const { path } of pages) {
    await page.goto(path);
    meta.push({
      title: await page.title(),
      description: await page.locator('meta[name="description"]').getAttribute('content'),
    });
  }
  expect(meta[0].title).not.toBe(meta[1].title);
  expect(meta[0].description).not.toBe(meta[1].description);
});

test('unknown URLs get a noindex 404 page with a way back', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Page not found');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'see all tools' }).click();
  await expect(page).toHaveURL(/\/tools\/$/);
});

test('home reaches the tools directory through the main navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Tools' }).click();
  await expect(page).toHaveURL(/\/tools\/$/);
  await expect(page.locator('h1')).toHaveText('Poker tools');
});
