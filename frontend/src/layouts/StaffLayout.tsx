// src/layouts/StaffLayout.tsx
import React from "react";
import Container from "../components/layout/Container";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 従業員専用ヘッダー（お客様向けは出さない） */}
      <header className="px-4 py-3 border-b bg-white">
        <nav className="flex gap-4 text-sm">
          <a href="/s/menu-admin">メニュー管理</a>
          <a href="/s/analytics">売上分析</a>
          <a href="/s/notices">掲示板編集</a>
        </nav>
      </header>
      <main className="py-6">
        <Container>{children}</Container>
      </main>
    </div>
  );
}