// src/layouts/CustomerLayout.tsx
import React from "react";
import NoticeBar from "../components/NoticeBar";
import Container from "../components/layout/Container";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* お客様専用ヘッダー（スタッフ向けは出さない） */}
      <header className="px-4 py-3 border-b bg-white">
        <nav className="flex gap-4 text-sm">
          <a href="/c/order">注文</a>
          <a href="/c/board">掲示板</a>
          <a href="/c/notices">お知らせ</a>
        </nav>
      </header>
      <NoticeBar />
      <main className="py-6">
        <Container>{children}</Container>
      </main>
    </div>
  );
}