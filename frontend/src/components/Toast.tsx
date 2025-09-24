// src/components/Toast.tsx
export default function Toast({
  message,
  onClose,
  timeoutMs = 1800,
}: {
  message: string;
  onClose: () => void;
  timeoutMs?: number;
}) {
  // 自動で閉じる
  // eslint-disable-next-line react-hooks/exhaustive-deps
  setTimeout(onClose, timeoutMs);

  return (
    <div
      role="status"
      data-testid="toast"
      className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded shadow-lg"
      style={{ zIndex: 1000 }}
    >
      {message}
    </div>
  );
}