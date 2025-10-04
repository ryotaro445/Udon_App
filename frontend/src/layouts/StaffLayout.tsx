// src/layouts/StaffLayout.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import Container from "../components/layout/Container";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 従業員専用ヘッダー */}
      <header className="px-4 py-3 border-b bg-white">
        <nav className="flex gap-3 text-base">
          <NavLink
            to="/s/menu-admin"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md border ${
                isActive
                  ? "bg-sky-600 text-white border-sky-600"
                  : "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
              }`
            }
          >
            メニュー管理
          </NavLink>
          <NavLink
            to="/s/analytics"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md border ${
                isActive
                  ? "bg-sky-600 text-white border-sky-600"
                  : "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
              }`
            }
          >
            売上分析
          </NavLink>
          <NavLink
            to="/s/notices"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md border ${
                isActive
                  ? "bg-sky-600 text-white border-sky-600"
                  : "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
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