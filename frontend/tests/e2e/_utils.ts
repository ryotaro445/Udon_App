import { expect, Page } from '@playwright/test';

export async function ensureServersUp(page: Page) {
  const front = await page.request.get('http://127.0.0.1:5173/');
  expect(front.status(), 'Front not running on :5173').toBeLessThan(400);

  const back = await page.request.get('http://127.0.0.1:8000/openapi.json');
  expect(back.status(), 'Backend not running on :8000').toBe(200);
}