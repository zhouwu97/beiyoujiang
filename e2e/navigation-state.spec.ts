import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('after_verify', '1'));
});

test('板块和排序写入 URL，后退可恢复地址状态', async ({ page }) => {
  await page.route('**/api/proxy/post/getAllPost', async (route) => {
    const body = route.request().postDataJSON?.() ?? {};
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ id: Number(body.plate) * 100 + Number(body.most), title: `板块${body.plate}-排序${body.most}`, content: '', plate: Number(body.plate), imageUrls: [], author: { id: 1, username: '作者', photo: '' }, likeCount: 0, commentCount: 0, readingQuantity: 0, timeAgo: '刚刚' }] }),
    });
  });
  await page.goto('/?plate=1&sort=2');
  await expect(page).toHaveURL(/plate=1.*sort=2/);
  await expect(page.locator('.post-title').filter({ hasText: '板块1-排序2' })).toBeVisible();
  await page.goto('/?plate=2&sort=1');
  await page.goBack();
  await expect(page).toHaveURL(/plate=1.*sort=2/);
  await expect(page.locator('.post-title').filter({ hasText: '板块1-排序2' })).toBeVisible();
});

test('新搜索默认回到全部 tab，不保留旧玩具 tab', async ({ page }) => {
  await page.route('**/api/proxy/toy/searchToyPost', async (route) => {
    const keyword = route.request().postDataJSON?.()?.content;
    const result = keyword === '词A'
      ? { toys: [{ id: 1, name: '词A玩具', rating: 9, reviewCount: 1, coverUrl: [] }], posts: [] }
      : { toys: [], posts: [{ id: 2, title: '词B帖子', content: '', plate: 2, imageUrls: [], author: { id: 1, username: '作者', photo: '' }, likeCount: 0, commentCount: 0, readingQuantity: 0, timeAgo: '刚刚' }] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: result, pagination: { hasMore: false } }) });
  });
  await page.goto('/search?q=%E8%AF%8DA');
  await expect(page.getByText('词A玩具')).toBeVisible();
  await page.getByRole('button', { name: /玩具/ }).first().click();
  await page.getByLabel('搜索玩具或帖子').fill('词B');
  await page.getByLabel('搜索玩具或帖子').press('Enter');
  await expect(page).toHaveURL(/q=%E8%AF%8DB/);
  await expect(page.getByText('词B帖子')).toBeVisible();
});
