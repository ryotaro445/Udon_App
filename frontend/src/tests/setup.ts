import "@testing-library/jest-dom/vitest";  

// jsdom の不足を補う（crypto.randomUUID）
if (!(globalThis as any).crypto) (globalThis as any).crypto = {} as any;
if (!(globalThis as any).crypto.randomUUID) {
  (globalThis as any).crypto.randomUUID = () => "test-user-token";
}
