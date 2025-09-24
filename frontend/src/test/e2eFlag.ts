// E2E用スイッチ：URL ?e2e=1 か、VITE_E2E=1 でオン
export function isE2E(): boolean {
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("e2e") === "1") return true;
  } catch {}
  return import.meta.env.VITE_E2E === "1";
}