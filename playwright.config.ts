import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: 'src/tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  // Chromium only, sized to the widths the QA checklist calls out.
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-375',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, hasTouch: true },
    },
    {
      name: 'mobile-320',
      use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 640 }, hasTouch: true },
    },
  ],
  // Tests run against the production build, not the dev server. --ignore-lock keeps
  // the server in the foreground; Astro otherwise detaches it under coding agents.
  webServer: {
    command: `npm run build && npm run preview -- --ignore-lock --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { SITE_URL: 'https://getpokerpath.com' },
  },
});
