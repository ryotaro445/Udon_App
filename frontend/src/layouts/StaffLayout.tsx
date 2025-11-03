// frontend/src/layouts/StaffLayout.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import Container from "../components/layout/Container";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { to: "/s/menu-admin", label: "メニュー管理" },
    { to: "/s/analytics", label: "売上分析" },
    { to: "/s/notices", label: "掲示板編集" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b bg-white shadow-sm">
        <nav className="flex flex-wrap gap-3 text-base">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg border font-semibold transition ${
                  isActive
                    ? "bg-[#0369a1] text-white border-[#0369a1]"
                    : "bg-white text-[#0369a1] border-[#0369a1] hover:bg-sky-50"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 py-6">
        <Container>{children}</Container>
      </main>
    </div>
  );
}