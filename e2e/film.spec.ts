import { expect, test } from '@playwright/test';

/**
 * The assembled film (§4): the thirteen steps play in the order the brief
 * lists them, the five seams sit between the scenes, and the scroll runs the
 * whole way down and back up without leaving a scene behind.
 */

/** The eight steps of §4 that are scenes; the other five are the cuts. */
const STEPS = [
  'hero-fade',
  'pin-hero',
  'hand-reveal',
  'hair-dissolve',
  'skin-layers',
  'cards',
  'counter',
  'cta',
];

test.describe('the thirteen steps', () => {
  test('play in the order of §4, with five seams between them', async ({ page }) => {
    await page.goto('/de/');
    /* Scenes name themselves when they register, which is after hydration. */
    await expect(page.locator('[data-scene="cta"]')).toBeAttached();

    const scenes = await page
      .locator('main [data-scene]')
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.scene ?? ''));

    /* Step 9 is drawn by several sections, so the same id may repeat; what the
       film is, is the order in which its steps first appear. */
    const order = scenes.filter((id, index) => scenes.indexOf(id) === index);
    expect([...order].sort()).toEqual([...STEPS].sort());
    /*
     * Steps 1 and 2 are one screen: the copy melts *while* the card is held,
     * so the melt lives inside the pinned section and reads second in the DOM.
     * Every other step follows the next one down the page.
     */
    expect(order.filter((id) => id !== 'hero-fade')).toEqual(
      STEPS.filter((id) => id !== 'hero-fade'),
    );
    expect(Math.abs(order.indexOf('hero-fade') - order.indexOf('pin-hero'))).toBe(1);
    await expect(page.locator('[data-flash]')).toHaveCount(5);
  });

  test('plays every scene on the scrollbar, at the length it asked for', async ({ page }) => {
    await page.goto('/de/');
    await expect(page.locator('[data-scene="cta"]')).toBeAttached();

    /* Laser Reveal asks for 140 vh and 80 vh (§5); the desktop scenario
       neither shortens nor rounds them. */
    const laser = page.locator('[data-scene="hand-reveal"]');
    await expect(laser).toHaveAttribute('data-scene-length', '140');
    await expect(laser).toHaveAttribute('data-scene-playback', 'scrub');
    await expect(page.locator('[data-scene="hair-dissolve"]')).toHaveAttribute(
      'data-scene-length',
      '80',
    );
    /* Hero asks for 120, the sections that ask for nothing get one screen. */
    await expect(page.locator('[data-scene="pin-hero"]')).toHaveAttribute(
      'data-scene-length',
      '120',
    );
    await expect(page.locator('[data-scene="cta"]')).toHaveAttribute('data-scene-length', '100');
  });

  test('leaves no gap between the scenes for the pin to show through', async ({ page }) => {
    await page.goto('/de/');

    const gaps = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('main section'));
      const out: number[] = [];
      for (let i = 1; i < sections.length; i += 1) {
        const previous = sections[i - 1]!.getBoundingClientRect();
        const next = sections[i]!.getBoundingClientRect();
        out.push(Math.round(next.top - previous.bottom));
      }
      return out;
    });

    for (const gap of gaps) expect(Math.abs(gap)).toBeLessThanOrEqual(1);
  });

  test('scrolls to the end and back without a scene sticking', async ({ page }) => {
    await page.goto('/de/');

    const laser = page.locator('[data-scene="hand-reveal"]');
    const progress = async () => Number((await laser.getAttribute('data-laser-progress')) ?? '0');

    for (let step = 0; step < 90; step += 1) {
      const atEnd = await page.evaluate(
        () => window.scrollY + window.innerHeight >= document.body.scrollHeight - 4,
      );
      if (atEnd) break;
      await page.mouse.wheel(0, 1400);
      await page.waitForTimeout(60);
    }

    await page.waitForTimeout(400);
    await expect(page.locator('#cta')).toBeInViewport();
    expect(await progress()).toBeGreaterThan(0.95);

    for (let step = 0; step < 120; step += 1) {
      if (await page.evaluate(() => window.scrollY <= 2)) break;
      await page.mouse.wheel(0, -1400);
      await page.waitForTimeout(60);
    }

    await page.waitForTimeout(600);
    expect(await progress()).toBeLessThan(0.05);
    await expect(page.locator('[data-hero-card]')).toBeInViewport();

    /* Nothing was left pinned off to one side on the way (R24.1). */
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
