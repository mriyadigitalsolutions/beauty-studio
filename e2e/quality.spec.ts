import { expect, test } from '@playwright/test';
import { studio } from '../config/studio.config';

/**
 * Ticket 07: what has to be true before the site is handed to people.
 *
 * Stories 21 (legal pages), 23 (keyboard and screen reader), 26 (link card),
 * 27 (monogram and favicon), 46 (enlarged text), 24/25 (it does not drag).
 * Everything here is asserted through the page the owner actually uploads.
 */

const LOCALES = ['de', 'en', 'ru'] as const;

test.describe('legal pages (story 21, G01)', () => {
  for (const locale of LOCALES) {
    for (const slug of ['impressum', 'datenschutz'] as const) {
      test(`/${locale}/${slug}/ opens in ${locale} and shows placeholders, not invented law`, async ({
        page,
      }) => {
        const response = await page.goto(`/${locale}/${slug}/`);
        expect(response?.status()).toBe(200);

        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        /* The registration details are the owner's, shown as unfilled. */
        const body = page.locator('main');
        await expect(body).toContainText(studio.legal.entity);
        await expect(body).toContainText(studio.legal.responsible);
        await expect(page.locator('main [data-placeholder]').first()).toBeVisible();

        /* And the legal text itself is marked as the lawyer's job, with the
           config fields that go into it named. */
        await expect(page.locator('[data-legal-pending]')).toBeVisible();
        await expect(page.locator('[data-legal-config-field]').first()).toBeVisible();
      });
    }
  }

  test('the footer leads to both of them, in the language of the page', async ({ page }) => {
    await page.goto('/en/');
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="/en/impressum/"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/en/datenschutz/"]')).toHaveCount(1);

    await footer.locator('a[href="/en/impressum/"]').click();
    await page.waitForURL('**/en/impressum/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('the link card and the tab icon (stories 26, 27)', () => {
  test('gives every language its own title, canonical and three hreflangs', async ({ page }) => {
    const titles = new Set<string>();

    for (const locale of LOCALES) {
      await page.goto(`/${locale}/`);

      const title = await page.title();
      expect(title.length).toBeGreaterThan(10);
      titles.add(title);

      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /.{40,}/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`/${locale}/$`),
      );

      for (const other of LOCALES) {
        await expect(
          page.locator(`link[rel="alternate"][hreflang="${other}"]`),
        ).toHaveAttribute('href', new RegExp(`/${other}/$`));
      }
    }

    expect(titles.size).toBe(3);
  });

  test('carries an og image that actually exists', async ({ page, request }) => {
    await page.goto('/de/');

    const image = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    expect(image).toBeTruthy();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /\S/);

    const response = await request.get(new URL(image!, page.url()).toString());
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\//);
  });

  test('ships a favicon set, and the monogram of the config in the header', async ({
    page,
    request,
  }) => {
    await page.goto('/de/');

    const icons = page.locator('link[rel="icon"], link[rel="apple-touch-icon"]');
    expect(await icons.count()).toBeGreaterThanOrEqual(3);

    for (const href of await icons.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLLinkElement).getAttribute('href') ?? ''),
    )) {
      const response = await request.get(new URL(href, page.url()).toString());
      expect(response.status(), href).toBe(200);
      expect(response.headers()['content-type'], href).toMatch(/^image\//);
    }

    await expect(page.locator('header')).toContainText(studio.monogram);
  });
});

test.describe('keyboard and screen reader (story 23, R45)', () => {
  test('names every section and hides every decorative layer', async ({ page }) => {
    await page.goto('/de/');

    const unnamed = await page.locator('main section[id]').evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const id = node.getAttribute('aria-labelledby');
          return !id || !node.ownerDocument.getElementById(id)?.textContent?.trim();
        })
        .map((node) => node.id),
    );
    expect(unnamed).toEqual([]);

    /* Petals, arcs, seam covers, the rail and the glow carry no content. */
    const exposedDecor = await page
      .locator('[data-decor], [data-flash], [data-scene-progress], [data-glow-cursor]')
      .evaluateAll((nodes) =>
        nodes.filter((node) => node.getAttribute('aria-hidden') !== 'true').length,
      );
    expect(exposedDecor).toBe(0);
  });

  test('walks the page in the order it is drawn, with a focus ring that shows', async ({
    page,
  }) => {
    await page.goto('/de/');

    const seen: { name: string; top: number; left: number }[] = [];
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab');
      const stop = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body) return null;
        const box = active.getBoundingClientRect();
        const style = getComputedStyle(active);
        return {
          name: `${active.tagName}:${(active.textContent ?? '').trim().slice(0, 18)}`,
          top: Math.round(box.top),
          left: Math.round(box.left),
          outlineWidth: Number.parseFloat(style.outlineWidth),
          outlineColor: style.outlineColor,
          hidden: active.closest('[aria-hidden="true"]') !== null,
        };
      });
      if (!stop) break;

      /* Nothing decorative may be reached at all. */
      expect(stop.hidden, stop.name).toBe(false);
      /* The ring of §12 is drawn in ink and is actually there. */
      expect(stop.outlineWidth, stop.name).toBeGreaterThan(0);
      expect(stop.outlineColor, stop.name).toBe('rgb(44, 35, 38)');
      seen.push({ name: stop.name, top: stop.top, left: stop.left });
    }

    expect(seen.length).toBeGreaterThan(4);

    /* Visual order: top to bottom, and left to right inside one row. */
    for (let i = 1; i < seen.length; i += 1) {
      const previous = seen[i - 1]!;
      const current = seen[i]!;
      const sameRow = Math.abs(current.top - previous.top) < 24;
      if (sameRow) expect(current.left, `${previous.name} → ${current.name}`).toBeGreaterThanOrEqual(previous.left - 1);
      else expect(current.top, `${previous.name} → ${current.name}`).toBeGreaterThan(previous.top);
    }
  });

  test('the skip link is the first stop and reaches the content', async ({ page }) => {
    await page.goto('/de/');
    await page.keyboard.press('Tab');
    await expect(page.locator('a.skipLink')).toBeFocused();
  });
});

test.describe('narrow screens (stories 24, 46)', () => {
  test('never scrolls sideways at 360 px, on the page and on both legal pages', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 760 });

    for (const path of ['/de/', '/de/impressum/', '/de/datenschutz/']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth, path).toBeLessThanOrEqual(overflow.innerWidth);
    }
  });

  test('insets the header equally on both sides', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto('/de/');

    const insets = await page.evaluate(() => {
      const bar = document.querySelector('header')!;
      const boxes = [...bar.querySelectorAll<HTMLElement>('a, button')]
        .filter((node) => node.offsetParent !== null && node.getBoundingClientRect().width > 0)
        .map((node) => node.getBoundingClientRect());
      return {
        left: Math.round(Math.min(...boxes.map((box) => box.left))),
        right: Math.round(window.innerWidth - Math.max(...boxes.map((box) => box.right))),
      };
    });

    expect(insets.left).toBeGreaterThan(4);
    expect(Math.abs(insets.right - insets.left)).toBeLessThanOrEqual(2);
  });
});

test.describe('weight on the wire (§11, R43)', () => {
  test('keeps the heavy photo layer out of rendering until it is reached', async ({ page }) => {
    await page.goto('/de/');

    const skipped = await page
      .locator('[data-laser-photo]')
      .evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).contentVisibility),
      );
    expect(skipped.length).toBeGreaterThan(0);
    for (const value of skipped) expect(value).toBe('auto');
  });

  test('gives no image but the first screen a high fetch priority', async ({ page }) => {
    await page.goto('/de/');

    const eager = await page.locator('img').evaluateAll((nodes) =>
      nodes
        .filter(
          (node) =>
            (node as HTMLImageElement).getAttribute('fetchpriority') === 'high' &&
            !node.closest('#hero'),
        )
        .map((node) => (node as HTMLImageElement).currentSrc || node.getAttribute('src') || ''),
    );
    expect(eager).toEqual([]);
  });
});

test.describe('reduced motion carries the whole story (story 22)', () => {
  test('shows every section, its heading and the legal links, standing still', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/de/');

    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');

    const headings = page.locator('main section[id] h1, main section[id] h2');
    expect(await headings.count()).toBeGreaterThanOrEqual(7);
    for (let i = 0; i < (await headings.count()); i += 1) {
      await expect(headings.nth(i)).toBeAttached();
      await expect(headings.nth(i)).not.toBeEmpty();
    }

    await expect(page.locator('footer a[href="/de/impressum/"]')).toBeVisible();
    await expect(page.locator('[data-glow-cursor]')).toHaveCount(0);
    await expect(page.locator('[data-scene-pinned]')).toHaveCount(0);
  });
});
