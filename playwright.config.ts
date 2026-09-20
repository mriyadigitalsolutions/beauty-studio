import { defineConfig, devices } from '@playwright/test';

/*
 * Two harnesses, because the site has two shapes and only one of them ships.
 *
 * `export` is the default and carries everything: it runs `npm run build` and
 * serves the resulting `out/` folder over a plain static host, which is exactly
 * what the owner uploads (§1, story 29). Before this the whole suite drove
 * `next dev`, so a regression visible only in the export never turned the suite
 * red.
 *
 * `dev-fixture` carries the handful of tests that drive a development-only
 * fixture (`?motion-fixture=1`, `?stats-fixture=…`). Those fixtures are
 * compiled out of the export on purpose — they exist so that the pin/scrub path
 * and the counter run-up can be checked without inventing a fact about the
 * studio — so they need the dev server. They are tagged `@dev-fixture`, and the
 * two projects split the suite on that tag: every test runs exactly once.
 */
const EXPORT_PORT = 3110;
const DEV_PORT = 3100;
const DEV_FIXTURE = /@dev-fixture/;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { trace: 'on-first-retry' },
  projects: [
    {
      name: 'export',
      grepInvert: DEV_FIXTURE,
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${EXPORT_PORT}` },
    },
    {
      name: 'dev-fixture',
      grep: DEV_FIXTURE,
      use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${DEV_PORT}` },
    },
  ],
  webServer: [
    {
      command: `npm run build && node scripts/serve-out.mjs ${EXPORT_PORT}`,
      url: `http://127.0.0.1:${EXPORT_PORT}/de/`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      command: `npx next dev --port ${DEV_PORT}`,
      url: `http://127.0.0.1:${DEV_PORT}/de/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
