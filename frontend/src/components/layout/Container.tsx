export default function Container({ children }: { children: React.ReactNode }) {
  // ← 器を横いっぱいに＆縮み禁止
  return (
    <div className="w-full min-w-0 mx-auto max-w-6xl px-4">
      {children}
    </div>
  );
}