import { defineConfig, devices } from '@playwright/test';
import { DEFAULT_PORT } from './server.mjs';

const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Keep this modest: the suite runs two projects (desktop, mobile) over
  // five routes plus axe, and CI has no GPU to spare.
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Serves the already-built `../dist` (see server.mjs). The site build is
  // static, so nothing here rebuilds it - run `npm run build` in the
  // project root before `npm test`.
  webServer: {
    command: `node server.mjs`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: { PORT: String(PORT) },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
