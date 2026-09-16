import { expect, test, type Page } from '@playwright/test';

/**
 * The Laser Reveal scene through the rendered page (§13, second seam): it
 * pins, the skin opens with the scroll and closes again on the way back, the
 * photographs arrive only when the visitor comes near, the slot they land in
 * never moves, and a scene without photographs is still a section you can
 * scroll past.
 */

const SCENE = '[data-scene="hand-reveal"]';

async function scrollTo(page: Page, offset: number) {
  await page.evaluate((y) => window.scrollTo(0, y), offset);
  await page.waitForTimeout(350);
}

async function sceneTop(page: Page) {
  return page.evaluate(() => {
    const section = document.querySelector('#laser-reveal');
    return section ? section.getBoundingClientRect().top + window.scrollY : 0;
  });
}

async function progress(page: Page) {
  const value = await page.locator(SCENE).getAttribute('data-laser-progress');
  return Number.parseFloat(value ?? '0');
}

test.describe('laser reveal', () => {
  test('pins and scrubs the skin open, then closed again on the way back', async ({ page }) => {
    await page.goto('/de/');
    await expect(page.locator(SCENE)).toHaveAttribute('data-scene-pinned', 'true');

    const top = await sceneTop(page);
    await scrollTo(page, top + 20);
    expect(await progress(page)).toBeLessThan(0.2);

    const height = page.viewportSize()?.height ?? 720;
    await scrollTo(page, top + height * 1.1);
    const opened = await progress(page);
    expect(opened).toBeGreaterThan(0.6);

    await scrollTo(page, top + 20);
    expect(await progress(page)).toBeLessThan(opened - 0.4);
  });

  test('keeps the photographs off the first screen and out of the layout (R01.1, R04.1)', async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/scenes/')) requested.push(request.url());
    });

    await page.goto('/de/');
    await page.waitForTimeout(700);
    expect(requested).toEqual([]);

    const stage = page.locator('#laser-reveal figure').first();
    /* The slot is reserved by the aspect ratio of the prepared crop, so the
       photograph lands in a box that already has its final height (CLS = 0). */
    const before = await stage.boundingBox();
    expect(await stage.evaluate((node) => getComputedStyle(node).aspectRatio)).not.toBe('auto');

    await scrollTo(page, await sceneTop(page));
    await expect.poll(() => requested.length, { timeout: 8000 }).toBeGreaterThan(0);
    await expect(
      page.locator('#laser-reveal [data-laser-layer="after"] image').first(),
    ).toHaveAttribute(
      'href',
      /\/scenes\/leg-after-\d+\.(avif|webp|png)/,
    );

    const after = await stage.boundingBox();
    expect(after?.height).toBeCloseTo(before?.height ?? 0, 0);
  });

  test('degrades to a text block when the photographs never arrive (R04.2)', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.route('**/scenes/**', (route) => route.abort());
    await page.goto('/de/');
    await scrollTo(page, await sceneTop(page));

    await expect(page.locator('[data-laser-unavailable]')).toBeVisible();
    await expect(page.locator('#laser-reveal h2')).toBeVisible();
    await expect(page.locator('#laser-reveal figure').first()).toBeHidden();

    /* The scroll carries on past the broken scene. */
    const before = await page.evaluate(() => window.scrollY);
    await scrollTo(page, before + 2400);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before);

    /* Only the aborted requests may be logged; nothing in the page throws. */
    expect(pageErrors).toEqual([]);
  });

  test('shows the smooth skin straight away when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/de/');

    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await expect(page.locator(SCENE)).not.toHaveAttribute('data-scene-pinned', 'true');
    await expect.poll(() => progress(page)).toBe(1);
    await expect(page.locator('#laser-reveal h2')).toBeVisible();
  });

  test('draws about 120 hair strokes on the frame', async ({ page }) => {
    await page.goto('/de/');
    const hairs = page.locator('#laser-reveal [data-laser-hairs] line');
    expect(await hairs.count()).toBe(120);
  });
});
