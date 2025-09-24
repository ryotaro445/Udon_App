// src/tests/setupTests.ts
import "@testing-library/jest-dom/vitest";

// ===== jsdom の不足を補う =====

// crypto.randomUUID
if (!(globalThis as any).crypto) (globalThis as any).crypto = {} as any;
if (!(globalThis as any).crypto.randomUUID) {
  (globalThis as any).crypto.randomUUID = () => "test-user-token";
}

// window.alert / window.prompt（jsdomには未実装）
if (!("alert" in globalThis)) (globalThis as any).alert = () => {};
if (!("prompt" in globalThis)) (globalThis as any).prompt = () => null;