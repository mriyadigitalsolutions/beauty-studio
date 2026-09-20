import { expect, test } from '@playwright/test';

/**
 * The motor, checked through the rendered page (the second seam of the spec):
 * the scroll runtime boots, the decor is there, and "reduce motion" really
 * means no pin, no flash, no drift — with the whole page still readable.
 * Scene-by-scene checks belong to ticket 07.
 */

test.describe('scroll runtime', () => {
  test('boots one smooth-scroll loop and mounts the five seam flashes', async ({ page }) => {
    await page.goto('/de/');

    await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
    await expect(page.locator('html')).toHaveClass(/lenis/);
    await expect(page.locator('[data-flash]')).toHaveCount(5);
  });

  test('leaves keyboard focus and #-links alone (R11.1)', async ({ page }) => {
    await page.goto('/de/');

    /* The pin spacers of thirteen scenes decide how far down the footer sits,
       so wait for the document to stop growing: focusing before that scrolls
       to where the link used to be and nothing moves it again. */
    await expect
      .poll(
        async () => {
          const before = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.waitForTimeout(250);
          const after = await page.evaluate(() => document.documentElement.scrollHeight);
          return before === after && after > 0;
        },
        { timeout: 10_000 },
      )
      .toBe(true);

    /* Tab-ing into something below the fold scrolls natively; Lenis must let
       that through instead of pulling the page back to where it was. */
    await page.evaluate(() => {
      const links = document.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      links[links.length - 1]?.focus();
    });

    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 4000 })
      .toBeGreaterThan(0);

    /* The scroll that brings it into view is smoothed by Lenis, so give it
       time to arrive — what must not happen is being pulled back instead. */
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const box = document.activeElement?.getBoundingClientRect();
            return box ? box.top >= 0 && box.bottom <= window.innerHeight + 1 : false;
          }),
        { timeout: 6000 },
      )
      .toBe(true);
  });

  test('carries the site-wide decor over every section', async ({ page }) => {
    await page.goto('/de/');

    const petals = page.locator('[data-decor="petals"] > span');
    expect(await petals.count()).toBeGreaterThanOrEqual(7);

    const depths = await petals.evaluateAll((nodes) =>
      Array.from(
        new Set(
          nodes.map((node) => getComputedStyle(node).getPropertyValue('--petal-sprite')),
        ),
      ),
    );
    expect(depths.length).toBeGreaterThanOrEqual(3);

    const arcs = page.locator('[data-decor="arcs"] path');
    expect(await arcs.count()).toBeGreaterThanOrEqual(3);
    const widths = await arcs.evaluateAll((nodes) =>
      nodes.map((node) => Number.parseFloat(getComputedStyle(node).strokeWidth)),
    );
    for (const width of widths) expect(width).toBeLessThanOrEqual(1);
  });
});

/*
 * The pin-and-scrub path itself, through a fixture scene that registers with
 * `useScene` exactly as ticket 03–05 sections will. Both halves of the fixture
 * take the same scene id — step 9 of §4 carries two sections — so this also
 * catches the second registration evicting the first.
 */
test.describe('a scene registered through useScene', { tag: '@dev-fixture' }, () => {
  const FIXTURE = '/de/?motion-fixture=1';

  async function wheelUntil(
    page: import('@playwright/test').Page,
    direction: 1 | -1,
    reached: () => Promise<boolean>,
  ): Promise<boolean> {
    for (let step = 0; step < 40; step += 1) {
      if (await reached()) return true;
      await page.mouse.wheel(0, 260 * direction);
      await page.waitForTimeout(110);
    }
    return reached();
  }

  test('pins both sections of the shared step and scrubs in both directions', async ({ page }) => {
    await page.goto(FIXTURE);

    const parts = page.locator('[data-fixture-part]');
    await expect(parts).toHaveCount(2);

    /* Neither registration was swallowed by the other. */
    await expect(page.locator('[data-fixture-part][data-scene-pinned="true"]')).toHaveCount(2);
    /* The fixture's id is offstage, so no section can shift these: two parts
       of one step, numbered in DOM order. */
    await expect(parts.nth(0)).toHaveAttribute('data-scene', 'offstage-fixture');
    await expect(parts.nth(1)).toHaveAttribute('data-scene', 'offstage-fixture');
    await expect(parts.nth(0)).toHaveAttribute('data-scene-part', '0');
    await expect(parts.nth(1)).toHaveAttribute('data-scene-part', '1');

    const progress = async (index: number) =>
      Number((await parts.nth(index).getAttribute('data-progress')) ?? '0');

    /* The fixture sits below the whole film, so close the distance in long
       strides first, then scrub in short ones. */
    const stride = async (reached: () => Promise<boolean>) => {
      for (let step = 0; step < 60; step += 1) {
        if (await reached()) return true;
        await page.mouse.wheel(0, 1500);
        await page.waitForTimeout(70);
      }
      return reached();
    };

    /* Forwards: the timeline follows the scroll. */
    expect(await stride(async () => (await progress(0)) > 0.05)).toBe(true);
    expect(await wheelUntil(page, 1, async () => (await progress(0)) > 0.6)).toBe(true);
    const forward = await progress(0);
    expect(forward).toBeGreaterThan(0.6);

    /* The second half of the shared step runs too, on its own trigger. */
    expect(await wheelUntil(page, 1, async () => (await progress(1)) > 0.6)).toBe(true);
    expect(await progress(0)).toBeGreaterThan(0.95);

    /* Backwards: scrolling up plays the scene back, it does not stick (R24.1). */
    expect(await wheelUntil(page, -1, async () => (await progress(1)) < 0.2)).toBe(true);
    expect(await progress(1)).toBeLessThan(0.2);
    expect(await wheelUntil(page, -1, async () => (await progress(0)) < 0.2)).toBe(true);
    expect(await progress(0)).toBeLessThan(forward);
  });

  test('lights the seam of a shared step once per pass, not once per section', async ({ page }) => {
    await page.goto(FIXTURE);

    /* The seam after step 9 belongs to the whole step: crossing the join
       between its two sub-scenes must not flash (§4 — thirteen steps, five
       flashes). Both crossings are made at a crawl, further apart in time than
       the 600 ms limiter, so a stray second flash cannot hide behind it. */
    const parts = page.locator('[data-fixture-part]');
    const progress = async (index: number) =>
      Number((await parts.nth(index).getAttribute('data-progress')) ?? '0');

    const seam = page.locator('[data-flash="flash-offstage-fixture"]');
    const flashes = async () => Number((await seam.getAttribute('data-flash-count')) ?? '0');

    /* Stop short of the first sub-scene's end: nothing has been crossed yet. */
    const approach = async () => {
      for (let step = 0; step < 90; step += 1) {
        if ((await progress(0)) > 0.8) return true;
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(90);
      }
      return (await progress(0)) > 0.8;
    };

    /* 150 px every 150 ms — a sub-scene is 120 vh, so one crossing takes about
       900 ms, outside the limiter's window however fast the machine is. */
    const crawl = async (direction: 1 | -1, done: () => Promise<boolean>) => {
      for (let step = 0; step < 50; step += 1) {
        if (await done()) return true;
        await page.mouse.wheel(0, 150 * direction);
        await page.waitForTimeout(150);
      }
      return done();
    };

    expect(await approach()).toBe(true);
    expect(await flashes()).toBe(0);

    /* Down through the join and the second sub-scene, and out of the step. */
    expect(await crawl(1, async () => (await progress(1)) > 0.999)).toBe(true);
    await crawl(1, async () => (await flashes()) >= 1);
    await page.waitForTimeout(900); // longer than the limiter: a duplicate would land
    expect(await flashes()).toBe(1);

    /* Back up the same way, through the seam and then the join: one flash for
       the pass, and none at the join. */
    expect(await crawl(-1, async () => (await progress(0)) < 0.5)).toBe(true);
    await page.waitForTimeout(900);
    expect(await flashes()).toBe(2);
  });

  test('keeps the fixture out of the page when it is not asked for', async ({ page }) => {
    await page.goto('/de/');
    await expect(page.locator('[data-fixture-part]')).toHaveCount(0);
  });
});

test.describe('reduced motion', () => {
  test('drops pin, flashes and smooth scroll, and keeps the whole page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/de/');

    expect(
      await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await expect(page.locator('html')).not.toHaveClass(/lenis/);
    await expect(page.locator('[data-flash]')).toHaveCount(0);
    await expect(page.locator('[data-scene-pinned]')).toHaveCount(0);

    const sections = page.locator('main section[id]');
    expect(await sections.count()).toBe(7);
    for (let i = 0; i < 7; i += 1) {
      await expect(sections.nth(i)).toBeAttached();
    }
  });
});
