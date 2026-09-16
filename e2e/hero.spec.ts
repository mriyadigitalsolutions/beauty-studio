import { expect, test, type Page } from '@playwright/test';

/**
 * The first screen, checked through the rendered page — the second seam of the
 * specification. What the reference promises (§14) and what §4 steps 1–2 do
 * with it: a glass card on the peach field, a two-line display headline, one
 * grotesque line under it, one white pill below, and copy that melts rather
 * than slides as the card is held.
 */

const HERO = 'section#hero';

function opacityOf(page: Page, target: string) {
  return page
    .locator(`[data-hero-melt="${target}"]`)
    .evaluate((node) => Number(getComputedStyle(node).opacity));
}

test.describe('hero, in the key of the reference', () => {
  test('is one full-bleed glass card with the shape of the reference', async ({ page }) => {
    await page.goto('/de/');

    const card = page.locator('[data-hero-card]');
    const shape = await card.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        radius: style.borderTopLeftRadius,
        backdrop:
          style.backdropFilter ||
          (style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter ||
          '',
        shadow: style.boxShadow,
        height: node.getBoundingClientRect().height,
        top: node.getBoundingClientRect().top,
        bottom: node.getBoundingClientRect().bottom,
      };
    });

    expect(shape.radius).toBe('28px');
    expect(shape.backdrop).toContain('blur(24px)');
    expect(shape.shadow).toContain('rgba(44, 35, 38, 0.18)');
    /* Full-bleed: the card fills the first screen and the peach field shows
       only as a margin — including under the sticky header, which the
       reference draws inside the card (§14). */
    const view = page.viewportSize()!.height;
    expect(shape.height).toBeGreaterThan(view * 0.9);
    expect(shape.top).toBeGreaterThanOrEqual(0);
    expect(shape.top).toBeLessThan(view * 0.05);
    expect(shape.bottom).toBeLessThanOrEqual(view + 1);
  });

  test('sets a two-line serif headline over one grotesque line and one pill', async ({ page }) => {
    await page.goto('/de/');

    const lines = page.locator('#hero-title span');
    await expect(lines).toHaveCount(2);
    const headline = await page
      .locator('#hero-title')
      .evaluate((node) => getComputedStyle(node).fontFamily);
    expect(headline).toContain('Bodoni');

    const subtitle = await page
      .locator('[data-hero-melt="subtitle"]')
      .evaluate((node) => getComputedStyle(node).fontFamily);
    expect(subtitle).toContain('Inter');

    /* Exactly one pill on the first screen, and it goes to the procedure. */
    const pills = page.locator(`${HERO} a, ${HERO} button`);
    await expect(pills).toHaveCount(1);
    await expect(pills.first()).toHaveAttribute('href', '#how-it-works');

    /* It sits below the copy, in the lower part of the card (§14). */
    const geometry = await page.evaluate(() => {
      const box = (selector: string) =>
        document.querySelector(selector)!.getBoundingClientRect();
      const card = box('[data-hero-card]');
      const cta = box('[data-hero-melt="cta"]');
      const title = box('#hero-title');
      return {
        ctaShare: (cta.top - card.top) / card.height,
        titleBelow: title.bottom < cta.top,
      };
    });
    expect(geometry.titleBelow).toBe(true);
    expect(geometry.ctaShare).toBeGreaterThan(0.6);
  });

  test('keeps the copy inside the card when the browser text is enlarged', async ({ page }) => {
    await page.goto('/de/');

    /* Story 46 (R45.1): 16px -> 24px is the browser's own "larger text". */
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '24px';
    });
    await page.waitForTimeout(200);

    const overflow = await page.evaluate(() => {
      const card = document.querySelector('[data-hero-card]')!.getBoundingClientRect();
      return ['#hero-title', '[data-hero-melt="subtitle"]', '[data-hero-melt="cta"]'].map(
        (selector) => {
          const box = document.querySelector(selector)!.getBoundingClientRect();
          return {
            selector,
            out: box.top < card.top - 1 || box.bottom > card.bottom + 1 || box.left < card.left - 1,
          };
        },
      );
    });
    expect(overflow.filter((entry) => entry.out)).toEqual([]);
  });

  test('registers both hero steps of §4 and pins the card', async ({ page }) => {
    await page.goto('/de/');

    await expect(page.locator(`${HERO}[data-scene="pin-hero"]`)).toHaveAttribute(
      'data-scene-pinned',
      'true',
    );
    await expect(page.locator('[data-scene="hero-fade"]')).toHaveCount(1);
  });

  test('melts the copy — headline before subtitle — and plays it back', async ({ page }) => {
    await page.goto('/de/');

    const sample = () =>
      page.evaluate(() => {
        const opacity = (target: string) =>
          Number(
            getComputedStyle(document.querySelector(`[data-hero-melt="${target}"]`)!).opacity,
          );
        return {
          title: opacity('title'),
          subtitle: opacity('subtitle'),
          cta: opacity('cta'),
        };
      });

    expect((await sample()).title).toBeGreaterThan(0.95);

    /* Creep through the melt and watch every frame of it rather than one
       lucky sample: the copy has to empty from the top the whole way down. */
    const trail: Awaited<ReturnType<typeof sample>>[] = [];
    for (let step = 0; step < 40; step += 1) {
      const point = await sample();
      trail.push(point);
      if (point.cta === 0) break;
      await page.mouse.wheel(0, 90);
      await page.waitForTimeout(110);
    }

    /* Never the other way round: the headline is always the faintest (R20). */
    for (const point of trail) {
      expect(point.subtitle).toBeGreaterThanOrEqual(point.title);
      expect(point.cta).toBeGreaterThanOrEqual(point.subtitle);
    }
    /* And there is a real moment where the headline has gone and the rest of
       the first screen has not — the melt is staggered, not one fade. */
    expect(trail.some((point) => point.title < 0.05 && point.subtitle > 0.1)).toBe(true);
    expect(trail[trail.length - 1]!.cta).toBe(0);

    /* It melts — blur and a small drift, not a slide. */
    const melt = await page.locator('[data-hero-melt="title"]').evaluate((node) => {
      const style = getComputedStyle(node);
      return { filter: style.filter, transform: style.transform };
    });
    expect(melt.filter).toMatch(/blur\(([1-9]|\d\d)/);
    expect(melt.transform).not.toBe('none');

    /* Going back up restores the first screen instead of sticking (R24.1). */
    for (let step = 0; step < 60; step += 1) {
      if ((await sample()).title > 0.95) break;
      await page.mouse.wheel(0, -160);
      await page.waitForTimeout(90);
    }
    const back = await sample();
    expect(back.title).toBeGreaterThan(0.95);
    expect(back.subtitle).toBeGreaterThan(0.95);
  });
});

test.describe('hero with reduced motion', () => {
  test('stands still and stays readable in full', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/de/');

    await expect(page.locator(`${HERO}[data-scene-pinned]`)).toHaveCount(0);
    for (const target of ['title', 'subtitle', 'cta']) {
      expect(await opacityOf(page, target)).toBe(1);
      await expect(page.locator(`[data-hero-melt="${target}"]`)).toBeVisible();
    }
  });
});
