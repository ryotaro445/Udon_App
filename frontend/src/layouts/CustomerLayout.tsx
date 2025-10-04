// src/layouts/CustomerLayout.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import NoticeBar from "../components/NoticeBar";
import Container from "../components/layout/Container";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50" style={{ writingMode: "horizontal-tb" }}>
      <header className="px-4 py-3 border-b bg-white">
        <nav className="flex gap-4 text-base">
          <NavLink
            to="/c/order"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg border font-semibold transition ${
                isActive
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-white text-[#0369a1] border-[#0369a1] hover:bg-sky-50"
              }`
            }
          >
            注文
          </NavLink>
          <NavLink
            to="/c/board"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg border font-semibold transition ${
                isActive
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-white text-[#0369a1] border-[#0369a1] hover:bg-sky-50"
              }`
            }
          >
            掲示板
          </NavLink>
        </nav>
      </header>

      <NoticeBar />

      <main className="py-6">
        <Container>{children}</Container>
      </main>
    </div>
  );
}