import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('after_verify', '1'));
});

test('消息 401 清理失效会话并显示登录入口', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('currentUser', JSON.stringify({ id: 1, userId: 1, username: 'e2e', photo: '', token: 'expired', level: 1, isGuest: false })));
  await page.route('**/api/proxy/message/getAllMessages', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'token expired' }) })
  );
  await page.goto('/message');
  await expect(page.getByText('登录后查看回复与通知')).toBeVisible();
  await expect(page.getByRole('link', { name: '去登录' })).toBeVisible();
});

test('登录 403 不再统一伪装成邮箱或密码错误', async ({ page }) => {
  await page.route('**/api/proxy/auth/login', (route) =>
    route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ code: 'BANNED', message: '账号已被封禁' }) })
  );
  await page.goto('/login');
  await page.getByPlaceholder('邮箱').fill('blocked@example.com');
  await page.getByPlaceholder('密码').fill('secret123');
  await page.getByRole('button', { name: '登 录' }).click();
  await expect(page.getByRole('status')).toHaveText('账号已被封禁');
});
