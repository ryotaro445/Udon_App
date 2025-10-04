export default function Container({ children }: { children: React.ReactNode }) {
  // 横幅を確実に確保
  return <div className="w-full mx-auto max-w-screen-xl px-4">{children}</div>;
}