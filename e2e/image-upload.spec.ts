import { test, expect } from '@playwright/test';

test('发帖上传单张超过 10MB 会被客户端拦截', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('after_verify', '1');
    localStorage.setItem('currentUser', JSON.stringify({ id: 1, userId: 1, username: 'e2e', photo: '', token: 'fake', level: 1, isGuest: false }));
  });
  await page.goto('/postMessage');
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: 'too-large.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(page.getByRole('status')).toHaveText('单张图片不能超过 10MB');
});
