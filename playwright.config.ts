import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 测试配置
 * webServer 自动启动 Next dev server（与 App Router 同一环境）。
 * 黄金链路走真实 API；「防假空」测试用 route mock 模拟接口 500，
 * 断言页面绝不显示"暂无内容"等空态文案。
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 3000 --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
