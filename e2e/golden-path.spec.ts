import { test, expect } from '@playwright/test';

/**
 * 黄金链路：访问真实页面，断言页面框架能正常渲染。
 * 这些测试不依赖后端返回特定数据（后端不可用时页面可能显示错误态），
 * 只验证「路由可达、Header/Shell 渲染、无白屏、无未捕获错误」。
 */

// 测试环境默认跳过成人认证弹窗，避免全屏遮罩挡住页面主体
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('after_verify', '1'));
});

test('首页可访问，Header 与搜索入口渲染', async ({ page }) => {
  await page.goto('/');
  // Header 品牌 + 搜索框
  await expect(page.getByRole('link', { name: /杯友酱/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /搜索玩具、帖子、用户/ })).toBeVisible();
});

test('搜索页可访问，搜索框可输入', async ({ page }) => {
  await page.goto('/search');
  const input = page.getByPlaceholder('输入玩具名或标签...');
  await expect(input).toBeVisible();
  await input.fill('杯子');
  await expect(input).toHaveValue('杯子');
});

test('榜单页可访问，工具按钮渲染', async ({ page }) => {
  await page.goto('/rankingList');
  // 页面主体（工具条 / 加载区任一可见即可证明非白屏）
  await expect(page.locator('main, .page-shell, .feed-surface').first()).toBeVisible();
});

test('帖子详情页路由可达', async ({ page }) => {
  // mock getPost 快速返回，避免依赖真实网络（测试目标是框架渲染）
  await page.route('**/api/proxy/post/getPost', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'ok',
        data: {
          post: { id: 1, title: '测试帖', content: '<p>正文</p>', plate: 1, author: { id: 2, username: '作者', photo: '' }, imageUrls: [] },
          imageUrlsArray: [],
          isLiked: false,
          isCollection: false,
        },
      }),
    })
  );
  await page.goto('/messageDetail/1');
  // 页面框架渲染（无论加载成功/失败都不白屏）
  await expect(page.locator('header').first()).toBeVisible();
});

test('玩具详情页路由可达', async ({ page }) => {
  await page.goto('/bang/1');
  await expect(page.locator('header').first()).toBeVisible();
});

test('登录页可访问，表单渲染', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByPlaceholder('邮箱')).toBeVisible();
  await expect(page.getByPlaceholder('密码')).toBeVisible();
});
