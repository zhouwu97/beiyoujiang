import { test, expect, type Page } from '@playwright/test';

/**
 * 防假空测试：模拟关键 API 返回 500，
 * 断言页面绝不把「接口挂了」伪装成「暂无内容 / 不存在」。
 */

// 测试环境默认跳过成人认证弹窗，避免全屏遮罩挡住页面主体
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('after_verify', '1'));
});

/** mock 指定 API 返回 500 */
async function mockApi500(page: Page, pathPattern: string) {
  await page.route(`**/api/proxy/${pathPattern}`, (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"boom"}' })
  );
}

/** 设置已登录 localStorage（currentUser），供需要登录态的页面使用 */
async function setLoggedIn(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ id: 1, userId: 1, username: 'e2e', photo: '', token: 'fake', level: 1, isGuest: false })
    );
  });
}

test('首页帖子 API 500 显示「加载失败」，不显示「这里还没有帖子」', async ({ page }) => {
  await mockApi500(page, 'post/getAllPost');
  await page.goto('/');
  await expect(page.getByText('这里还没有帖子，快来发布第一帖吧~')).not.toBeVisible();
  await expect(page.getByText('加载失败，请检查网络后重试')).toBeVisible();
});

test('帖子详情评论 API 500 显示「评论加载失败」，不显示「还没有评论」', async ({ page }) => {
  await mockApi500(page, 'comment/getPostComment');
  // 帖子详情 API 正常，评论 API 挂掉
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
  await expect(page.getByText('还没有评论，抢个沙发~')).not.toBeVisible();
  await expect(page.getByText('评论加载失败，请检查网络后重试')).toBeVisible();
});

test('玩具详情 API 500 显示「加载失败」，不显示「玩具不存在」', async ({ page }) => {
  await mockApi500(page, 'toy/getToy');
  await page.goto('/bang/1');
  await expect(page.getByText('玩具不存在或已下架')).not.toBeVisible();
  await expect(page.getByText('加载失败，请检查网络后重试')).toBeVisible();
});

test('测评 API 500 显示「测评加载失败」，不显示「暂无公开测评」', async ({ page }) => {
  // 注意：getToyAllReview 实际走 /api/proxy/toyComment/getToyAllReview
  await mockApi500(page, 'toyComment/getToyAllReview');
  // 玩具详情 API 正常返回
  await page.route('**/api/proxy/toy/getToy', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'ok',
        data: {
          toy: { id: 1, name: '测试玩具', category: '1', stimulation: '2', coverUrl: [], rating: 8.7 },
        },
      }),
    })
  );
  await page.goto('/bang/1');
  await expect(page.getByText('暂无公开测评')).not.toBeVisible();
  await expect(page.getByText('测评加载失败，请检查网络后重试')).toBeVisible();
});

test('消息 API 500 显示「加载失败」，不显示「暂无消息」', async ({ page }) => {
  await setLoggedIn(page);
  await mockApi500(page, 'message/getAllMessages');
  await page.goto('/message');
  await expect(page.getByText('暂无消息')).not.toBeVisible();
  await expect(page.getByText('加载失败，请检查网络后重试')).toBeVisible();
});
