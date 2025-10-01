// src/layouts/StaffLayout.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import Container from "../components/layout/Container";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 従業員専用ヘッダー（お客様向けリンクは一切出さない） */}
      <header className="px-4 py-3 border-b bg-white">
        <nav className="flex gap-4 text-sm">
          <NavLink
            to="/s/menu-admin"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:underline"
              }`
            }
          >
            メニュー管理
          </NavLink>
          <NavLink
            to="/s/analytics"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:underline"
              }`
            }
          >
            売上分析
          </NavLink>
          <NavLink
            to="/s/notices"
            className={({ isActive }) =>
              `px-2 py-1 rounded ${
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:underline"
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