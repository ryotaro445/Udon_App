import { test, expect } from '@playwright/test';

test.describe('[demo] 顧客ハッピーパス', () => {
  test('[demo] /order?table=12 → 1品→注文完了', async ({ page }) => {
    // ① ガード回避をナビ前に仕込む（初期リダイレクトを防ぐ）
    await page.addInitScript(() => {
      localStorage.setItem('mode', 'customer');
      localStorage.setItem('table', '12'); // 実装のキー名に合わせて
      localStorage.setItem('onboarded', '1'); // 必要なら
    });

    await page.goto('/order?table=12', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/order\?table=12$/);

    // ② API成功を明示的に待ってからUI待機（実装のエンドポイントに合わせて）
    await page.waitForResponse(r =>
      r.url().includes('/api/menus') && r.ok()
    , { timeout: 15_000 });

    // ③ 要素出現
    const firstCard = page.getByTestId('menu-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 15_000 });

    // ④ 1品追加
    await firstCard.click();
    const qtyPlus = page.getByTestId('qty-plus');
    if (await qtyPlus.isVisible().catch(() => false)) await qtyPlus.click();

    const addBtn = page.getByTestId('add-to-cart');
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
    } else {
      await firstCard.getByTestId('add-to-cart').click();
    }

    // ⑤ カート更新確認
    const total = page.getByTestId('cart-total');
    const badge = page.getByTestId('cart-count');
    if (await total.isVisible().catch(() => false)) {
      await expect(total).not.toHaveText(/¥?0/);
    } else if (await badge.isVisible().catch(() => false)) {
      await expect(badge).toHaveText(/^[1-9]\d*$/);
    }

    // ⑥ 注文確定
    const submit = page.getByTestId('order-submit');
    await expect(submit).toBeEnabled();
    await submit.click();

    // ⑦ 完了の検証
    const toast = page.getByTestId('toast-success');
    const doneMsg = page.getByText(/(注文が完了|ありがとうございました|Order Completed)/);
    if (await toast.isVisible().catch(() => false)) {
      await expect(toast).toBeVisible();
    } else {
      await expect(doneMsg).toBeVisible();
    }
  });
});