import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('after_verify', '1'));
});

test('首页帖子 500 保持错误态而不是空态', async ({ page }) => {
  await page.route('**/api/proxy/post/getAllPost', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'server error' }) })
  );
  await page.goto('/');
  await expect(page.getByText('加载失败，请检查网络后重试')).toBeVisible();
  await expect(page.getByText('这里还没有帖子，快来发布第一帖吧~')).toBeHidden();
});

test('帖子接口超时状态显示超时错误', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/proxy/post/getAllPost', async (route) => {
    calls += 1;
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'REQUEST_TIMEOUT', message: '请求超时' }) });
  });
  await page.goto('/');
  await expect.poll(() => calls).toBeGreaterThan(0);
  await expect(page.getByText('请求超时，请稍后重试', { exact: true })).toBeVisible({ timeout: 15_000 });
});

test('帖子详情 404 与网络错误分开显示', async ({ page }) => {
  await page.route('**/api/proxy/post/getPost', (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'not found' }) })
  );
  await page.goto('/messageDetail/404');
  await expect(page.getByText('帖子不存在或已删除')).toBeVisible();
  await expect(page.getByText('帖子加载失败，请检查网络后重试')).not.toBeVisible();
});

test('损坏的认证 localStorage 不会导致白屏', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('currentUser', '{broken-json');
    localStorage.setItem('currentTourist', '{also-broken');
  });
  await page.goto('/login');
  await expect(page.getByPlaceholder('邮箱')).toBeVisible();
  expect(await page.evaluate(() => ({ user: localStorage.getItem('currentUser'), tourist: localStorage.getItem('currentTourist') }))).toEqual({ user: null, tourist: null });
});

test('图片代理上游 502 由调用方保留为可降级错误', async ({ page }) => {
  await page.route('**/api/asset*', (route) =>
    route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ code: 'ASSET_NETWORK_ERROR' }) })
  );
  const response = await page.goto('/api/asset?url=https%3A%2F%2Fbeiyoujiang.com%2FheadPortrait%2Fmissing.webp');
  expect(response?.status()).toBe(502);
});
