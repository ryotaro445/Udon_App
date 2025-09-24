// src/testHook.ts
declare global {
  interface Window {
    __TEST__?: {
      setMode: (role: 'customer' | 'staff') => void;
      addToCart: (itemId: string, qty?: number, opts?: Record<string, string>) => void;
    };
  }
}

export function attachTestHook() {
  if (import.meta.env.MODE !== 'production') {
    window.__TEST__ = {
      setMode(role) {
        try { localStorage.setItem('mode', role.toUpperCase()); } catch {}
        try { localStorage.setItem('role', role); } catch {}
        document.cookie = `mode=${role}; path=/`;
      },
      addToCart(itemId, qty = 1, opts = {}) {
        // あなたの状態管理に合わせて実装
        // 例: window.store.dispatch(cartActions.add({ itemId, qty, options: opts }))
        const cartRaw = localStorage.getItem('cart') ?? '[]';
        const cart = JSON.parse(cartRaw);
        cart.push({ itemId, qty, options: opts });
        localStorage.setItem('cart', JSON.stringify(cart));
      },
    };
  }
}