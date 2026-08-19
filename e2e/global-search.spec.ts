import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('after_verify', '1'));
});

test.describe('GlobalSearch 全局浮层搜索与交互', () => {
  test('A. Ctrl+K 快捷键可聚焦全局搜索输入框', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await page.keyboard.press('Control+k');
    await expect(searchInput).toBeFocused();
  });

  test('B. 空搜索框聚焦时展示「大家都在搜」真实热词', async ({ page }) => {
    await page.route('**/api/proxy/toy/getAllKeyword', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 1, keyword: '黄油小姐', count: 120 },
            { id: 2, keyword: '堕落修女', count: 90 },
            { id: 3, keyword: '龙娘', count: 80 },
          ],
        }),
      })
    );

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await searchInput.focus();

    await expect(page.getByText('大家都在搜')).toBeVisible();
    await expect(page.getByRole('button', { name: '黄油小姐' })).toBeVisible();
    await expect(page.getByRole('button', { name: '堕落修女' })).toBeVisible();
    await expect(page.getByRole('button', { name: '龙娘' })).toBeVisible();
  });

  test('C. 输入关键词后 debounce 弹出玩具与帖子 suggestions', async ({ page }) => {
    await page.route('**/api/proxy/toy/searchToyPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            toys: [
              {
                id: 101,
                name: '黄油小姐 二代',
                rating: 9.1,
                reviewCount: 44,
                coverUrl: ['/images/test.png'],
                tags: '奶香体质',
              },
            ],
            posts: [
              {
                id: 201,
                title: '黄油小姐2代实际体验',
                plate: 2,
                commentCount: 19,
                timeAgo: '刚刚',
              },
            ],
          },
          pagination: { hasMore: false },
        }),
      })
    );

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await searchInput.fill('黄油小姐');

    // 等待 250ms debounce 与浮层渲染
    await expect(page.getByText('黄油小姐 二代')).toBeVisible();
    await expect(page.getByText('44 篇测评')).toBeVisible();
    await expect(page.getByText('黄油小姐2代实际体验')).toBeVisible();
    await expect(page.getByText('19 回复')).toBeVisible();
  });

  test('D. 点击玩具 Suggestion 直接跳转 /bang/:id 并关闭 Popover', async ({ page }) => {
    await page.route('**/api/proxy/toy/searchToyPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            toys: [
              {
                id: 101,
                name: '黄油小姐 二代',
                rating: 9.1,
                reviewCount: 44,
                coverUrl: [],
              },
            ],
            posts: [],
          },
          pagination: { hasMore: false },
        }),
      })
    );
    // Mock 详情接口，避免跳转后因真实后端网络超时而拖慢路由渲染
    await page.route('**/api/proxy/toy/getToy', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 101, name: '黄油小姐 二代', rating: 9.1, reviewCount: 44, coverUrlsArray: [] },
        }),
      })
    );
    await page.route('**/api/proxy/toy/getToyAllReview', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    );

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await searchInput.fill('黄油小姐');

    const toyBtn = page.locator('.global-search-toy-item').first();
    await expect(toyBtn).toBeVisible();
    await toyBtn.click();

    await expect(page).toHaveURL(/\/bang\/101/, { timeout: 10000 });
    await expect(page.locator('.global-search-popover')).toBeHidden();
  });

  test('E. 点击帖子 Suggestion 直接跳转 /messageDetail/:id 并关闭 Popover', async ({ page }) => {
    await page.route('**/api/proxy/toy/searchToyPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            toys: [],
            posts: [
              {
                id: 202,
                title: '小玩决赛圈了，各位大佬来点建议',
                plate: 2,
                commentCount: 15,
                timeAgo: '刚刚',
              },
            ],
          },
          pagination: { hasMore: false },
        }),
      })
    );
    await page.route('**/api/proxy/post/getPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            post: { id: 202, title: '小玩决赛圈了', content: '', plate: 2, author: { id: 1, username: '测试', photo: '' }, imageUrls: [] },
          },
        }),
      })
    );

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await searchInput.fill('小玩');

    const postBtn = page.locator('.global-search-post-item').first();
    await expect(postBtn).toBeVisible();
    await postBtn.click();

    await expect(page).toHaveURL(/\/messageDetail\/202/, { timeout: 10000 });
    await expect(page.locator('.global-search-popover')).toBeHidden();
  });

  test('F. 键盘上下箭头高亮与 Enter 选中跳转', async ({ page }) => {
    await page.route('**/api/proxy/toy/searchToyPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            toys: [
              { id: 101, name: '玩具1', rating: 8.0, reviewCount: 10, coverUrl: [] },
              { id: 102, name: '玩具2', rating: 9.0, reviewCount: 20, coverUrl: [] },
            ],
            posts: [],
          },
          pagination: { hasMore: false },
        }),
      })
    );
    await page.route('**/api/proxy/toy/getToy', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 102, name: '玩具2', rating: 9.0, reviewCount: 20, coverUrlsArray: [] },
        }),
      })
    );
    await page.route('**/api/proxy/toy/getToyAllReview', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    );

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await searchInput.fill('玩具');

    await expect(page.getByText('玩具1')).toBeVisible();

    // 第一次向下箭头高亮玩具1
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.global-search-toy-item').first()).toHaveClass(/is-selected/);

    // 第二次向下箭头高亮玩具2
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.global-search-toy-item').nth(1)).toHaveClass(/is-selected/);

    // 回车选中玩具2
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/bang\/102/, { timeout: 10000 });
  });

  test('G. 桌面端 Esc 关闭 Popover 且保持在当前页面', async ({ page }) => {
    await page.route('**/api/proxy/toy/searchToyPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            toys: [{ id: 101, name: '黄油小姐', rating: 9.0, reviewCount: 10, coverUrl: [] }],
            posts: [],
          },
          pagination: { hasMore: false },
        }),
      })
    );

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await searchInput.fill('黄油');

    await expect(page.locator('.global-search-popover')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.global-search-popover')).toBeHidden();
    await expect(page).toHaveURL('/');
  });

  test('H. 移动端 Overlay 打开、body scroll lock 与 Esc/取消 关闭', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const mobileSearchBtn = page.getByRole('button', { name: '搜索' });
    await expect(mobileSearchBtn).toBeVisible();
    await mobileSearchBtn.click();

    const overlay = page.getByRole('dialog', { name: '移动端搜索' });
    await expect(overlay).toBeVisible();

    // 检查 body 是否锁定滚动
    const isBodyLocked = await page.evaluate(() => document.body.style.overflow === 'hidden');
    expect(isBodyLocked).toBe(true);

    // 按 Esc 关闭 Overlay
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();

    // 检查 body 滚动是否恢复
    const isBodyUnlocked = await page.evaluate(() => document.body.style.overflow !== 'hidden');
    expect(isBodyUnlocked).toBe(true);
    await expect(page).toHaveURL('/');
  });

  test('I. 搜索竞态控制：慢请求不会覆盖后发的快请求', async ({ page }) => {
    await page.route('**/api/proxy/toy/searchToyPost', async (route) => {
      const postData = route.request().postDataJSON?.() || {};
      const keyword = postData.content;

      if (keyword === '慢查询A') {
        // 故意延迟 500ms
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              toys: [{ id: 999, name: '旧数据A-不应展示', rating: 5.0, reviewCount: 1, coverUrl: [] }],
              posts: [],
            },
            pagination: { hasMore: false },
          }),
        });
      } else if (keyword === '快查询B') {
        // 快速返回
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              toys: [{ id: 888, name: '新数据B-最终结果', rating: 9.9, reviewCount: 99, coverUrl: [] }],
              posts: [],
            },
            pagination: { hasMore: false },
          }),
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({ data: { toys: [], posts: [] }, pagination: { hasMore: false } }) });
      }
    });

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');

    // 先输入“慢查询A”
    await searchInput.fill('慢查询A');
    // 立即换成“快查询B”
    await page.waitForTimeout(300); // 触发慢查询A的防抖
    await searchInput.fill('快查询B');

    // 等待快查询B返回并显示
    await expect(page.getByText('新数据B-最终结果')).toBeVisible();

    // 等待更长时间确保慢查询A返回
    await page.waitForTimeout(600);

    // 校验：旧数据A绝对不能冒充出来覆盖新数据B
    await expect(page.getByText('新数据B-最终结果')).toBeVisible();
    await expect(page.getByText('旧数据A-不应展示')).toBeHidden();
  });

  test('J. 输入新关键词时立即清空旧结果并展示 loading skeleton', async ({ page }) => {
    let delaySecondRequest = false;

    await page.route('**/api/proxy/toy/searchToyPost', async (route) => {
      const postData = route.request().postDataJSON?.() || {};
      const keyword = postData.content;

      if (keyword === '黄油小姐') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              toys: [{ id: 101, name: '黄油小姐 旧条目', rating: 9.0, reviewCount: 10, coverUrl: [] }],
              posts: [],
            },
            pagination: { hasMore: false },
          }),
        });
      } else if (keyword === '龙娘') {
        if (delaySecondRequest) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              toys: [{ id: 102, name: '龙娘 新条目', rating: 9.5, reviewCount: 20, coverUrl: [] }],
              posts: [],
            },
            pagination: { hasMore: false },
          }),
        });
      }
    });

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');

    // 1. 先搜索黄油小姐并渲染
    await searchInput.fill('黄油小姐');
    await expect(page.getByText('黄油小姐 旧条目')).toBeVisible();

    // 2. 准备让下一次请求延迟返回
    delaySecondRequest = true;

    // 3. 输入新关键词“龙娘”
    await searchInput.fill('龙娘');

    // 4. 断言：旧条目“黄油小姐 旧条目”必须立即消失，且出现 loading skeleton
    await expect(page.getByText('黄油小姐 旧条目')).toBeHidden();
    await expect(page.getByTestId('search-loading')).toBeVisible();

    // 5. 待新请求返回后，展示新条目
    await expect(page.getByText('龙娘 新条目')).toBeVisible();
    await expect(page.getByTestId('search-loading')).toBeHidden();
  });
});
