// src/components/layout/Container.tsx
export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0 mx-auto max-w-6xl px-4">
      {children}
    </div>
  );
}