import { test, expect } from '@playwright/test';

test.describe('Blog Frontend', () => {
  test('should display the homepage with title', async ({ page }) => {
    // 假设开发服务器在 3000 或 3001 端口运行
    await page.goto('http://localhost:3000');
    
    // 检查首页标题
    await expect(page.locator('h1')).toContainText('欢迎来到我的博客');
    
    // 检查导航栏链接
    const loginLink = page.getByRole('link', { name: '登录' });
    await expect(loginLink).toBeVisible();
  });

  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // 验证是否重定向到登录页
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible();
  });

  test('login page should render correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await expect(page.locator('h1')).toContainText('欢迎回来');
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  });
});
