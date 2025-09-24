import { test, expect } from '@playwright/test';

test.describe('[demo] 従業員ログイン', () => {
  test('[demo] ModeSelect → パス一致 → /menu-admin', async ({ page }) => {
    const staffPass = process.env.VITE_STAFF_PASS || 'admin';

    // ① prompt を確実にモック（クリック前、ナビ前）
    await page.addInitScript(([pass]) => {
      // @ts-ignore
      window.prompt = () => pass;
      localStorage.setItem('mode', 'staff'); // ガードがある場合に備える
    }, [staffPass]);

    await page.goto('/mode', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/mode$/);

    // ② ボタンのロケータ（testid があればそれを第一候補に）
    const staffBtn = page.getByTestId('btn-staff')
      .or(page.getByRole('button', { name: /従業員|スタッフ/ }));

    await staffBtn.click();

    // ③ 遷移完了
    await expect(page).toHaveURL(/\/menu-admin$/);

    // ④ 主要要素の確認
    const adminRoot = page.getByTestId('admin-root');
    const heading = page.getByRole('heading', { name: /メニュー管理|Menu Admin/i });
    if (await adminRoot.isVisible().catch(() => false)) {
      await expect(adminRoot).toBeVisible();
    } else {
      await expect(heading).toBeVisible();
    }
  });
});