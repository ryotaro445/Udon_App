// frontend/src/layouts/CustomerLayout.tsx
import React from "react";
import NoticeBar from "../components/NoticeBar";
import Container from "../components/layout/Container";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50" style={{ writingMode: "horizontal-tb" }}>
      {/* ナビゲーションバー削除 */}
      <NoticeBar />
      <main className="py-6">
        <Container>{children}</Container>
      </main>
    </div>
  );
}