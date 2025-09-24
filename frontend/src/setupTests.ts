// src/setupTests.ts
import "@testing-library/jest-dom/vitest"; // ← ここがポイント！（/vitest）
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());


// すべてのテストで window.alert をモック化する
beforeAll(() => {
  // もし alert が未定義ならダミー関数を入れる
  if (!window.alert) {
    window.alert = vi.fn();
  }
});

// テストごとに呼び出し履歴をリセット
beforeEach(() => {
  vi.clearAllMocks();
});