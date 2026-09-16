import { expect, test } from '@playwright/test';

/**
 * Smoke test of the frame: the page exists in three languages and carries all
 * seven sections. The scene-by-scene e2e suite belongs to ticket 07.
 */

const SECTION_IDS = [
  'hero',
  'laser-reveal',
  'skin-layers',
  'how-it-works',
  'benefits',
  'stats',
  'cta',
];

test('the landing page carries all seven sections in order', async ({ page }) => {
  await page.goto('/de/');

  const ids = await page.locator('main section[id]').evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(ids).toEqual(SECTION_IDS);

  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('each language serves its own page and its own lang attribute', async ({ page }) => {
  for (const locale of ['de', 'en', 'ru'] as const) {
    await page.goto(`/${locale}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main section#hero')).toBeVisible();
  }
});

test('unfilled studio facts are shown as placeholders, never invented', async ({ page }) => {
  await page.goto('/de/');
  await expect(page.locator('[data-placeholder]').first()).toBeVisible();
  await expect(page.locator('footer')).toContainText('[');
});

test('the root follows the browser language', async ({ browser }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL;

  const russian = await browser.newContext({ baseURL, locale: 'ru-RU' });
  const russianPage = await russian.newPage();
  await russianPage.goto('/', { waitUntil: 'commit' });
  await russianPage.waitForURL('**/ru/');
  await russian.close();

  const french = await browser.newContext({ baseURL, locale: 'fr-FR' });
  const frenchPage = await french.newPage();
  await frenchPage.goto('/', { waitUntil: 'commit' });
  await frenchPage.waitForURL('**/de/');
  await french.close();
});

test('the root works without JavaScript', async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.locator('meta[http-equiv="refresh"]')).toHaveAttribute('content', /\/de\//);
  await expect(page.getByRole('link')).toHaveCount(3);
  await context.close();
});
