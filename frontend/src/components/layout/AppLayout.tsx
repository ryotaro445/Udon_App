import AppHeader from "./AppHeader";
import Container from "./Container";
import NoticeBar from "../NoticeBar";



export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <NoticeBar />
      <main className="py-6">
        <Container>{children}</Container>
      </main>
    </div>
  );
}