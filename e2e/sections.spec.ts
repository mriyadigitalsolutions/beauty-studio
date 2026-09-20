import { expect, test } from '@playwright/test';

/**
 * The four remaining scenes of §4 — skin, cards, counter, CTA — through the
 * rendered page (the second seam of §13). Everything asserted here is a
 * promise of the ticket: what the visitor sees while the studio config is
 * still empty, and what the scroll motor has actually registered.
 */

test.describe('skin cross-section (story 10)', () => {
  test('draws the four layers of §14 and lets the beam reach the root', async ({ page }) => {
    await page.goto('/de/');

    const section = page.locator('#skin-layers');
    await expect(section).toHaveAttribute('data-scene', 'skin-layers');

    /* Labels of the drawing, plus one note per layer under the headline. */
    await expect(section.locator('[data-layer]')).toHaveCount(4);
    for (const label of ['Epidermis', 'Dermis', 'Unterhaut', 'Follikel']) {
      await expect(section.getByText(label, { exact: true }).first()).toBeVisible();
    }

    const geometry = await section.locator('[data-beam]').evaluate((node) => {
      const line = node as SVGLineElement;
      const bulb = node.ownerDocument.querySelector('#skin-layers circle')!;
      return {
        beamEnd: line.y2.baseVal.value,
        bulbY: Number(bulb.getAttribute('cy')),
        bulbR: Number(bulb.getAttribute('r')),
      };
    });
    expect(Math.abs(geometry.beamEnd - geometry.bulbY)).toBeLessThanOrEqual(geometry.bulbR);
  });

  test('paints every shape with the colour of the token it carries', async ({ page }) => {
    await page.goto('/de/');

    const painted = await page.locator('#skin-layers [data-token]').evaluateAll((nodes) =>
      nodes.map((node) => {
        const styles = getComputedStyle(node);
        const token = (node as HTMLElement).dataset.token ?? '';
        const expected = getComputedStyle(document.documentElement)
          .getPropertyValue(token)
          .trim();
        const used = (node as HTMLElement).dataset.paint === 'stroke' ? styles.stroke : styles.fill;
        return { token, expected, used };
      }),
    );

    expect(painted.length).toBeGreaterThanOrEqual(5);
    for (const shape of painted) {
      expect(shape.expected).not.toBe('');
      /* Computed colours come back as rgb(); compare through the same lens. */
      const rgb = await page.evaluate((hex) => {
        const probe = document.createElement('span');
        probe.style.color = hex;
        document.body.append(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        return value;
      }, shape.expected);
      expect(shape.used).toBe(rgb);
    }
  });
});

test.describe('the cards step (stories 12, 13)', () => {
  test('carries How It Works and Benefits as two parts of one scene', async ({ page }) => {
    await page.goto('/de/');

    await expect(page.locator('#how-it-works')).toHaveAttribute('data-scene', 'cards');
    await expect(page.locator('#benefits')).toHaveAttribute('data-scene', 'cards');
    const parts = await page.locator('[data-scene="cards"]').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).dataset.scenePart),
    );
    expect(new Set(parts).size).toBe(parts.length);
  });

  test('numbers at least four steps and compares at least four benefits with wax', async ({ page }) => {
    await page.goto('/de/');

    const steps = page.locator('#how-it-works [data-step]');
    expect(await steps.count()).toBeGreaterThanOrEqual(4);
    await expect(steps.first()).toContainText('01');

    const benefits = page.locator('#benefits [data-benefit]');
    expect(await benefits.count()).toBeGreaterThanOrEqual(4);
    /* The comparison is the point of the section: every card names wax. */
    expect(await benefits.filter({ hasText: 'Wachs' }).count()).toBe(await benefits.count());
  });
});

test.describe('prices (story 50)', () => {
  test('hides the block completely while no zone is filled in', async ({ page }) => {
    await page.goto('/de/');
    /* The config ships with an empty `prices` array — no empty frame, no
       table head, nothing. */
    await expect(page.locator('#prices')).toHaveCount(0);
  });
});

test.describe('counters (stories 14, 20)', () => {
  test('shows three slots and not one invented number', async ({ page }) => {
    await page.goto('/de/');

    const stats = page.locator('#stats [data-stat]');
    await expect(stats).toHaveCount(3);
    await expect(page.locator('#stats [data-placeholder]')).toHaveCount(3);
    expect(await page.locator('#stats').innerText()).not.toMatch(/\d/);
  });
});

test.describe('the counter runs once (story 14, 44)', { tag: '@dev-fixture' }, () => {
  /* Numbers for the run-up come from the query, not from the config: the
     studio's own figures stay placeholders until the owner types them (§8). */
  const FIXTURE = '/de/?stats-fixture=1200,8,340';

  async function descend(
    page: import('@playwright/test').Page,
    direction: 1 | -1,
    steps: number,
    read: () => Promise<string>,
  ): Promise<string[]> {
    const samples: string[] = [];
    for (let step = 0; step < steps; step += 1) {
      await page.mouse.wheel(0, 260 * direction);
      await page.waitForTimeout(70);
      samples.push(await read());
    }
    return samples;
  }

  test('runs the numbers up on the way down and never again', async ({ page }) => {
    await page.goto(FIXTURE);

    const first = page.locator('#stats [data-stat-number]').first();
    const read = async () => ((await first.textContent()) ?? '').trim();
    await expect(page.locator('#stats [data-stat]')).toHaveCount(3);

    /* Down to the counter, sampling all the way: the number has to move. */
    let seen: string[] = [];
    for (let pass = 0; pass < 12 && (await read()) !== '1.200'; pass += 1) {
      seen = seen.concat(await descend(page, 1, 10, read));
    }
    expect(await read()).toBe('1.200');
    expect(new Set(seen).size).toBeGreaterThan(1);

    /* Back up: it must not unwind, and not start over on the way down again. */
    const up = await descend(page, -1, 30, read);
    const downAgain = await descend(page, 1, 30, read);
    expect(up.filter((value) => value !== '1.200')).toEqual([]);
    expect(downAgain.filter((value) => value !== '1.200')).toEqual([]);

    await expect(page.locator('#stats [data-stat-number]')).toHaveText(['1.200', '8', '340']);
  });
});

test.describe('the last screen (stories 15, 16, 45)', () => {
  test('disables the button and says why when neither link is configured', async ({ page }) => {
    await page.goto('/de/');

    const button = page.locator('#cta button[disabled]');
    await expect(button).toBeVisible();
    await expect(page.locator('#cta [data-cta-unavailable]')).toBeVisible();

    /* Nothing leads into a dead end: no tel: and no messenger link is drawn
       while the config holds placeholders. */
    await expect(page.locator('#cta a[href^="tel:"]')).toHaveCount(0);
    await expect(page.locator('#cta a[href^="http"]')).toHaveCount(0);
  });
});

test.describe('reduced motion (story 22)', () => {
  test('keeps all four scenes readable and unpinned', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/de/');

    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    for (const id of ['#skin-layers', '#how-it-works', '#benefits', '#stats', '#cta']) {
      await expect(page.locator(`${id} h2`)).toBeVisible();
    }
    await expect(page.locator('#how-it-works [data-step]').first()).toBeVisible();
    await expect(page.locator('#stats [data-stat]').first()).toBeVisible();
    await expect(page.locator('[data-scene-pinned]')).toHaveCount(0);
  });
});
