import { devices, expect, test } from '@playwright/test';
import { DIM_DURATION_MS } from '@/components/FlashTransition/flash-limiter';

/**
 * The same film below the §10 breakpoint: no pin anywhere, the seams dim
 * instead of flashing, Laser Reveal survives at half the scroll height, and
 * the glow cursor never mounts on a screen you touch.
 */

test.use({ ...devices['Pixel 5'] });

test.describe('the mobile scenario (§10)', () => {
  test('drops the pins, dims instead of flashing and halves Laser Reveal', async ({ page }) => {
    await page.goto('/de/');
    await expect(page.locator('[data-scene="hand-reveal"]')).toBeAttached();

    await expect(page.locator('[data-scene-pinned]')).toHaveCount(0);
    await expect(page.locator('[data-glow-cursor]')).toHaveCount(0);

    /* Laser Reveal stays — it is the core of the story — at half the scroll. */
    await expect(page.locator('[data-scene="hand-reveal"]')).toHaveAttribute(
      'data-scene-length',
      '70',
    );
    await expect(page.locator('[data-scene="hair-dissolve"]')).toHaveAttribute(
      'data-scene-length',
      '40',
    );
    /* Everything else keeps its length; only the pin is gone. */
    await expect(page.locator('[data-scene="skin-layers"]')).toHaveAttribute(
      'data-scene-length',
      '100',
    );

    /*
     * Half the petals (§10): nine are mounted, four of them are drawn. Bounded
     * from both sides on purpose — an upper bound alone is also met by a layer
     * that renders nothing at all.
     */
    await expect(page.locator('[data-decor="petals"] > span')).toHaveCount(9);
    await expect(page.locator('[data-decor="petals"] > span:visible')).toHaveCount(4);
  });

  test('shows a scene as it comes into the screen, not a screen later', async ({ page }) => {
    await page.goto('/de/');
    const closing = page.locator('[data-scene="cta"]');
    await expect(closing).toHaveAttribute('data-scene-playback', 'reveal');

    /* Walk down a quarter of a screen at a time and stop at the first frame in
       which the closing section is on screen at all — the moment §10 calls
       "entering the screen". */
    const entered = async () =>
      page.evaluate(() => {
        const box = document.getElementById('cta')!.getBoundingClientRect();
        return box.top < window.innerHeight && box.bottom > 0;
      });

    for (let step = 0; step < 80; step += 1) {
      if (await entered()) break;
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.25));
      await page.waitForTimeout(90);
    }
    expect(await entered()).toBe(true);

    /* From here on nothing is scrolled: the last screen of the film has to
       arrive with its copy on it. Scrubbing it without a pin is what used to
       hand it over blank and keep it blank for another screen of scrolling. */
    await expect
      .poll(
        async () =>
          page.evaluate(
            () => Number(getComputedStyle(document.getElementById('cta-title')!).opacity),
          ),
        { timeout: 4000 },
      )
      .toBeGreaterThan(0.9);
    expect(await entered()).toBe(true); // still where we stopped
  });

  test('dims the seam for the length of §10 instead of flashing it', async ({ page }) => {
    await page.goto('/de/');
    await expect(page.locator('[data-scene="cta"]')).toBeAttached();

    /*
     * A cover this short cannot be sampled by polling from the test side, so
     * the page reports it: every change of the overlay's inline style is
     * timestamped, and the cover is on while the overlay's own opacity is 1.
     * The three layers are recorded too — bloom, flash, dim, in that order —
     * because §10 asks for a dim, and a flash played for 180 ms would still
     * be a flash.
     */
    await page.evaluate(() => {
      const marks: { mode: string; at: number; on: number; layers: number[] }[] = [];
      (window as unknown as { seamMarks: typeof marks }).seamMarks = marks;
      for (const node of document.querySelectorAll<HTMLElement>('[data-flash]')) {
        const record = () =>
          marks.push({
            mode: node.dataset.flashMode ?? '',
            at: performance.now(),
            on: Number(node.style.opacity || '0'),
            layers: [...node.children].map((layer) =>
              Number((layer as HTMLElement).style.opacity || '0'),
            ),
          });
        new MutationObserver(record).observe(node, {
          attributes: true,
          attributeFilter: ['style', 'data-flash-mode'],
          subtree: true,
        });
      }
    });

    const played = page.locator('[data-flash][data-flash-count]');
    for (let step = 0; step < 60; step += 1) {
      if ((await played.count()) > 0) break;
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.75));
      await page.waitForTimeout(180);
    }
    expect(await played.count()).toBeGreaterThan(0);
    await page.waitForTimeout(DIM_DURATION_MS * 4); // let the cover finish

    const marks = await page.evaluate(
      () => (window as unknown as { seamMarks: { mode: string; at: number; on: number; layers: number[] }[] }).seamMarks,
    );

    /* Below the breakpoint no seam may flash. */
    expect(new Set(marks.map((mark) => mark.mode))).toEqual(new Set(['dim']));

    const start = marks.findIndex((mark) => mark.on === 1);
    expect(start).toBeGreaterThanOrEqual(0);
    const end = marks.findIndex((mark, index) => index > start && mark.on === 0);
    expect(end).toBeGreaterThan(start);

    /* It is the dim layer that darkens — the third of the three — and the
       flash layer stays where it was. */
    const during = marks.slice(start, end);
    expect(Math.max(...during.map((mark) => mark.layers[2] ?? 0))).toBeGreaterThan(0);
    expect(Math.max(...during.map((mark) => mark.layers[1] ?? 0))).toBe(0);

    /* And it lasts the dim of §10, not the flash-and-bloom of a desktop seam:
       the bound follows `DIM_DURATION_MS`, so shortening the constant without
       shortening the cover turns this red. */
    const lasted = marks[end]!.at - marks[start]!.at;
    expect(lasted).toBeGreaterThan(DIM_DURATION_MS * 0.5);
    expect(lasted).toBeLessThan(DIM_DURATION_MS * 2);
  });
});
