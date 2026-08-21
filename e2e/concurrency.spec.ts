import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('after_verify', '1');
    localStorage.setItem('currentUser', JSON.stringify({ id: 1, userId: 1, username: 'e2e', photo: '', token: 'fake', level: 1, isGuest: false }));
  });
});

test('快速切换板块时慢请求不能覆盖当前板块', async ({ page }) => {
  await page.route('**/api/proxy/post/getAllPost', async (route) => {
    const plate = route.request().postDataJSON?.()?.plate;
    if (plate === 1) await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: plate, title: `当前板块${plate}`, content: '', plate, imageUrls: [], author: { id: 1, username: '作者', photo: '' }, likeCount: 0, commentCount: 0, readingQuantity: 0, timeAgo: '刚刚' }] }) });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '大型倒模' }).click();
  await page.getByRole('button', { name: '杯酱论坛' }).click();
  await expect(page.locator('.post-title').filter({ hasText: '当前板块2' })).toBeVisible();
  await page.waitForTimeout(700);
  await expect(page.locator('.post-title').filter({ hasText: '当前板块1' })).toBeHidden();
});

test('点赞按钮连续点击只发出一个 mutation', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/proxy/post/getAllPost', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 99, title: '并发测试帖', content: '', plate: 2, imageUrls: [], author: { id: 1, username: '作者', photo: '' }, likeCount: 0, commentCount: 0, readingQuantity: 0, timeAgo: '刚刚' }] }) })
  );
  await page.route('**/api/proxy/post/likePost', async (route) => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/');
  const like = page.getByRole('button', { name: '点赞' }).first();
  await expect(like).toBeVisible();
  await Promise.all([like.click(), like.click(), like.click(), like.click(), like.click()]);
  await page.waitForTimeout(400);
  expect(calls).toBe(1);
});

test('发布按钮连续点击只提交一次', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/proxy/post/addPost', async (route) => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) });
  });
  await page.goto('/postMessage');
  await page.getByLabel('帖子标题').fill('并发发布测试');
  await page.getByLabel('帖子正文').fill('正文');
  const publish = page.getByRole('button', { name: '发布' });
  await Promise.all([publish.click(), publish.click()]);
  await page.waitForTimeout(400);
  expect(calls).toBe(1);
});
