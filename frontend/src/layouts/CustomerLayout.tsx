import React from "react";
import NoticeBar from "../components/NoticeBar";
import Container from "../components/layout/Container";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50" style={{ writingMode: "horizontal-tb" }}>
      <header className="px-4 py-3 border-b bg-white">
        <nav className="flex gap-3 text-base">
          <a
            href="/c/order"
            className="px-4 py-2 rounded-lg border border-sky-700 bg-gradient-to-b from-sky-600 to-sky-700
                       text-white shadow hover:from-sky-700 hover:to-sky-800"
          >
            注文
          </a>
          <a
            href="/c/board"
            className="px-4 py-2 rounded-lg border border-sky-700 bg-gradient-to-b from-sky-600 to-sky-700
                       text-white shadow hover:from-sky-700 hover:to-sky-800"
          >
            掲示板
          </a>
          {/* お知らせは削除 */}
        </nav>
      </header>

      <NoticeBar />

      <main className="py-6">
        <Container>{children}</Container>
      </main>
    </div>
  );
}