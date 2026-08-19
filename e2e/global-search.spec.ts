import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('after_verify', '1'));
});

test.describe('GlobalSearch 两级搜索架构（Suggestion + 正式结果页）', () => {
  test('A. Ctrl+K 快捷键可聚焦全局搜索输入框', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await page.keyboard.press('Control+k');
    await expect(searchInput).toBeFocused();
  });

  test('B. 空搜索框聚焦时展示「大家都在搜」，点击热词直达 /search?q=xxx', async ({ page }) => {
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
    await page.route('**/api/proxy/toy/searchToyPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { toys: [], posts: [] },
          pagination: { hasMore: false },
        }),
      })
    );

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await searchInput.focus();

    await expect(page.getByText('大家都在搜')).toBeVisible();
    const chip = page.getByRole('button', { name: '黄油小姐' });
    await expect(chip).toBeVisible();
    await chip.click();

    await expect(page).toHaveURL(/\/search\?q=%E9%BB%84%E6%B2%B9%E5%B0%8F%E5%A7%90/, { timeout: 10000 });
  });

  test('C. 输入关键词后 debounce 弹出 Popover，且显示「搜索」按钮与底部「查看全部」', async ({ page }) => {
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
    await expect(page.getByText('黄油小姐2代实际体验')).toBeVisible();
    await expect(page.getByRole('button', { name: '搜索', exact: true })).toBeVisible();
    await expect(page.getByText(/查看“黄油小姐”的全部搜索结果/)).toBeVisible();
  });

  test('D. 无选中状态下直接回车 -> 进入 /search?q=xxx 正式搜索结果页', async ({ page }) => {
    await page.route('**/api/proxy/toy/searchToyPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            toys: [{ id: 101, name: '黄油小姐 二代', rating: 9.1, reviewCount: 44, coverUrl: [] }],
            posts: [],
          },
          pagination: { hasMore: false },
        }),
      })
    );

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await searchInput.fill('黄油小姐');

    await expect(page.locator('.global-search-popover')).toBeVisible();

    // 直接回车（selectedIndex 为 -1）
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=%E9%BB%84%E6%B2%B9%E5%B0%8F%E5%A7%90/, { timeout: 10000 });
  });

  test('E. 点击「搜索」按钮与点击底部「查看全部结果」-> 进入 /search?q=xxx', async ({ page }) => {
    await page.route('**/api/proxy/toy/searchToyPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            toys: [{ id: 101, name: '龙娘 玩具', rating: 9.5, reviewCount: 30, coverUrl: [] }],
            posts: [],
          },
          pagination: { hasMore: false },
        }),
      })
    );

    await page.goto('/');
    const searchInput = page.getByLabel('全局搜索');
    await searchInput.fill('龙娘');

    await expect(page.locator('.global-search-popover')).toBeVisible();

    // 点击搜索框内的“搜索”按钮
    const searchBtn = page.locator('.global-search-submit-btn').first();
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    await expect(page).toHaveURL(/\/search\?q=%E9%BE%99%E5%A8%98/, { timeout: 10000 });
  });

  test('F. 上下箭头高亮选中条目 + 回车 -> 直达 /bang/:id 或 /messageDetail/:id', async ({ page }) => {
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

    // 回车选中高亮的玩具2
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

  test('H. 移动端 Overlay 搜索、body scroll lock 与回车进入 /search?q=xxx', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/proxy/toy/searchToyPost', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { toys: [], posts: [] },
          pagination: { hasMore: false },
        }),
      })
    );

    await page.goto('/');

    const mobileSearchBtn = page.getByRole('button', { name: '搜索' });
    await expect(mobileSearchBtn).toBeVisible();
    await mobileSearchBtn.click();

    const overlay = page.getByRole('dialog', { name: '移动端搜索' });
    await expect(overlay).toBeVisible();

    // 检查 body 锁定
    const isBodyLocked = await page.evaluate(() => document.body.style.overflow === 'hidden');
    expect(isBodyLocked).toBe(true);

    const mobileInput = page.getByLabel('搜索输入');
    await mobileInput.fill('移动端搜索词');
    await mobileInput.press('Enter');

    // 进入 /search?q=xxx 并自动关闭 Overlay
    await expect(page).toHaveURL(/\/search\?q=/, { timeout: 10000 });
    await expect(overlay).toBeHidden();
  });

  test('I. 直接访问 /search?q=xxx 自动发起搜索并渲染左侧帖子与右侧玩具 Rail', async ({ page }) => {
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
                title: '黄油小姐深度测评帖',
                content: '<p>正文内容</p>',
                plate: 2,
                commentCount: 19,
                readingQuantity: 300,
                likeCount: 12,
                imageUrls: [],
                timeAgo: '刚刚',
                author: { id: 1, username: '评测家', photo: '', level: 5, introduction: '', isGuest: false },
              },
            ],
          },
          pagination: { hasMore: false },
        }),
      })
    );

    await page.goto('/search?q=%E9%BB%84%E6%B2%B9%E5%B0%8F%E5%A7%90');

    // 断言输入框已回填
    const input = page.getByLabel('搜索玩具或帖子');
    await expect(input).toHaveValue('黄油小姐');

    // 断言主区域帖子与右侧玩具卡片均可见
    await expect(page.getByText('黄油小姐深度测评帖')).toBeVisible();
    await expect(page.getByText('黄油小姐 二代')).toBeVisible();
  });

  test('J. 搜索结果页内再次输入新词搜索，URL 与结果同步更新，支持浏览器后退恢复', async ({ page }) => {
    await page.route('**/api/proxy/toy/searchToyPost', async (route) => {
      const postData = route.request().postDataJSON?.() || {};
      const keyword = postData.content;

      if (keyword === '黄油小姐') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              toys: [{ id: 101, name: '黄油小姐 条目', rating: 9.0, reviewCount: 10, coverUrl: [] }],
              posts: [],
            },
            pagination: { hasMore: false },
          }),
        });
      } else if (keyword === '龙娘') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              toys: [{ id: 102, name: '龙娘 独家条目', rating: 9.5, reviewCount: 20, coverUrl: [] }],
              posts: [],
            },
            pagination: { hasMore: false },
          }),
        });
      }
    });

    // 1. 访问黄油小姐
    await page.goto('/search?q=%E9%BB%84%E6%B2%B9%E5%B0%8F%E5%A7%90');
    await expect(page.getByText('黄油小姐 条目')).toBeVisible();

    // 2. 搜索页顶部重新输入龙娘并按回车
    const input = page.getByLabel('搜索玩具或帖子');
    await input.fill('龙娘');
    await input.press('Enter');

    // 3. 断言 URL 更新为龙娘，结果更新为龙娘
    await expect(page).toHaveURL(/\/search\?q=%E9%BE%99%E5%A8%98/, { timeout: 10000 });
    await expect(page.getByText('龙娘 独家条目')).toBeVisible();
    await expect(page.getByText('黄油小姐 条目')).toBeHidden();

    // 4. 浏览器后退
    await page.goBack();
    await expect(page).toHaveURL(/\/search\?q=%E9%BB%84%E6%B2%B9%E5%B0%8F%E5%A7%90/, { timeout: 10000 });
    await expect(page.getByText('黄油小姐 条目')).toBeVisible();
  });
});
