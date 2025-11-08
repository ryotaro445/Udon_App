// frontend/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ModeProvider } from "./context/ModeCtx";
import { TableProvider } from "./context/TableCtx";
import { ToastProvider } from "./components/ui/ToastProvider";
import "./styles/tokens.css";
import "./styles/components.css";
import { attachTestHook } from "./testHook";
import "./index.css";

// --- E2Eブートストラップ ---
(function bootstrapE2E() {
  try {
    const sp = new URLSearchParams(window.location.search);
    const isFlag = sp.get("e2e") === "1" || (import.meta as any)?.env?.VITE_E2E === "1";
    if (isFlag) {
      localStorage.setItem("mode", "customer");
      const tableFromUrl = sp.get("table");
      if (!localStorage.getItem("table")) {
        localStorage.setItem("table", tableFromUrl ?? "12");
      }
    }
  } catch {}
})();

attachTestHook();

const el = document.getElementById("root");
if (!el) throw new Error("#root not found");

createRoot(el).render(
  <React.StrictMode>
    <BrowserRouter>
      <ModeProvider>
        <TableProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </TableProvider>
      </ModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);