import { expect, test } from '@playwright/test';

/**
 * What the visitor drives the film with: the glow that follows the mouse
 * (stories 6, 7), the menu in the header (story 28) and the side indicator of
 * where in the film they are (story 49).
 */

const GLOW = '[data-glow-cursor]';

/**
 * The scenes name themselves once they register, and the pin spacers that
 * follow change the height of the page — so an anchor only leads where it
 * says once the film is both registered and measured.
 */
async function filmReady(page: import('@playwright/test').Page) {
  await expect(page.locator('[data-scene="cta"]')).toHaveAttribute('data-scene-length', '100');
  await expect
    .poll(
      async () => {
        const before = await page.evaluate(() => document.body.scrollHeight);
        await page.waitForTimeout(250);
        const after = await page.evaluate(() => document.body.scrollHeight);
        return before === after;
      },
      { timeout: 10_000 },
    )
    .toBe(true);
}

async function centre(page: import('@playwright/test').Page, selector: string) {
  return page.evaluate((sel) => {
    const box = document.querySelector(sel)?.getBoundingClientRect();
    return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : null;
  }, selector);
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

test.describe('the glow cursor', () => {
  test('lags behind the pointer and settles on it', async ({ page }) => {
    await page.goto('/de/');
    await expect(page.locator(GLOW)).toBeAttached();
    await page.mouse.move(320, 300);
    await page.waitForTimeout(900);

    const settled = await centre(page, GLOW);
    expect(settled).not.toBeNull();
    expect(distance(settled!, { x: 320, y: 300 })).toBeLessThan(30);

    /* A jump across the screen is not followed instantly — that lag is the
       inertia the brief asks for. */
    await page.mouse.move(980, 620);
    const chasing = await centre(page, GLOW);
    expect(distance(chasing!, { x: 980, y: 620 })).toBeGreaterThan(80);

    await page.waitForTimeout(900);
    const arrived = await centre(page, GLOW);
    expect(distance(arrived!, { x: 980, y: 620 })).toBeLessThan(30);
  });

  test('turns the sand of §14 over a link and comes back', async ({ page }) => {
    await page.goto('/de/');
    await page.mouse.move(320, 300);
    await expect(page.locator(GLOW)).toBeAttached();

    const sand = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--sand').trim(),
    );
    const tint = async () =>
      page.evaluate(
        (sel) =>
          getComputedStyle(document.querySelector(sel)!).getPropertyValue('--glow-tint').trim(),
        GLOW,
      );

    expect(await tint()).not.toBe(sand);

    await page.locator('header a').first().hover();
    await expect.poll(tint).toBe(sand);
    await expect(page.locator(GLOW)).toHaveAttribute('data-cursor-over', 'interactive');

    await page.mouse.move(320, 700);
    await expect.poll(tint).not.toBe(sand);
  });

  test('sends out one wave per click and never stacks them', async ({ page }) => {
    await page.goto('/de/');
    await page.mouse.move(400, 500);
    await expect(page.locator(GLOW)).toBeAttached();

    const ripples = page.locator('[data-cursor-ripple]');
    for (let click = 0; click < 5; click += 1) {
      await page.mouse.click(400 + click * 10, 500);
    }

    expect(await ripples.count()).toBeLessThanOrEqual(1);
    await expect(ripples).toHaveAttribute('data-ripple-seq', '5');
  });

  test('is not there for a visitor who asked for less motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/de/');
    await page.mouse.move(320, 300);
    await page.waitForTimeout(300);
    await expect(page.locator(GLOW)).toHaveCount(0);
  });
});

test.describe('the header menu', () => {
  const MENU = '[data-nav-menu]';
  const BURGER = '[data-nav-toggle]';

  test('opens, takes the visitor to a section and closes behind them', async ({ page }) => {
    await page.goto('/de/');
    await filmReady(page);

    await expect(page.locator(`${MENU} a`)).toHaveCount(0);
    await page.locator(BURGER).click();

    const items = page.locator(`${MENU} a`);
    await expect(items).toHaveCount(7);
    await expect(page.locator(BURGER)).toHaveAttribute('aria-expanded', 'true');

    await items.nth(5).click();
    await expect(page.locator(`${MENU} a`)).toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 6000 }).toBeGreaterThan(200);
    await expect(page.locator('#stats')).toBeInViewport();
  });

  test('hands the focus to the section it was asked for', async ({ page }) => {
    await page.goto('/de/');
    await filmReady(page);
    await page.locator(BURGER).click();
    await page.locator(`${MENU} a`).nth(5).click();

    /* The panel closes under the focused link, so the focus has to be put
       somewhere on purpose — otherwise the next Tab starts from the top of
       the document, and the tab order no longer follows the page. */
    await expect
      .poll(async () => page.evaluate(() => document.activeElement?.id ?? ''))
      .toBe('stats');
  });

  test('closes on Escape and hands the focus back to the button', async ({ page }) => {
    await page.goto('/de/');
    await page.locator(BURGER).click();
    await expect(page.locator(`${MENU} a`)).toHaveCount(7);

    await page.keyboard.press('Escape');
    await expect(page.locator(`${MENU} a`)).toHaveCount(0);
    await expect(page.locator(BURGER)).toBeFocused();
  });

  test('closes on a click outside itself', async ({ page }) => {
    await page.goto('/de/');
    await page.locator(BURGER).click();
    await expect(page.locator(`${MENU} a`)).toHaveCount(7);

    await page.mouse.click(40, 600);
    await expect(page.locator(`${MENU} a`)).toHaveCount(0);
  });

  test('keeps the keyboard inside it while it is open', async ({ page }) => {
    await page.goto('/de/');
    await page.locator(BURGER).click();
    await expect(page.locator(`${MENU} a`)).toHaveCount(7);

    for (let step = 0; step < 10; step += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        (sel) => document.querySelector(sel)?.contains(document.activeElement) ?? false,
        MENU,
      );
      expect(inside).toBe(true);
    }
  });
});

test.describe('the scene indicator', () => {
  const RAIL = '[data-scene-progress]';

  test('shows where in the film the visitor is, and jumps there on a click', async ({ page }) => {
    await page.goto('/de/');
    await filmReady(page);

    const marks = page.locator(`${RAIL} [data-stop]`);
    await expect(marks).toHaveCount(7);
    await expect(marks.first()).toHaveAttribute('data-current', 'true');

    await marks.nth(6).click();
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 6000 }).toBeGreaterThan(200);
    await expect(page.locator('#cta')).toBeInViewport();
    await expect.poll(async () => marks.nth(6).getAttribute('data-current')).toBe('true');
  });

  test('is gone for a visitor who asked for less motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/de/');
    await expect(page.locator(RAIL)).toHaveCount(0);
  });
});
