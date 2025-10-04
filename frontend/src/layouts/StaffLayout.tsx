// src/layouts/StaffLayout.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import Container from "../components/layout/Container";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-4 py-3 border-b bg-white">
        <nav className="flex gap-4 text-base">
          <NavLink
            to="/s/menu-admin"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg border font-semibold transition ${
                isActive
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-white text-[#0369a1] border-[#0369a1] hover:bg-sky-50"
              }`
            }
          >
            メニュー管理
          </NavLink>
          <NavLink
            to="/s/analytics"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg border font-semibold transition ${
                isActive
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-white text-[#0369a1] border-[#0369a1] hover:bg-sky-50"
              }`
            }
          >
            売上分析
          </NavLink>
          <NavLink
            to="/s/notices"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg border font-semibold transition ${
                isActive
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-white text-[#0369a1] border-[#0369a1] hover:bg-sky-50"
              }`
            }
          >
            掲示板編集
          </NavLink>
        </nav>
      </header>

      <main className="py-6">
        <Container>{children}</Container>
      </main>
    </div>
  );
}