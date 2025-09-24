import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import workerUrl from "qr-scanner/qr-scanner-worker.min.js?url";
import { apiGet } from "../api/client";
import type { TableInfo } from "../types";
import { useNavigate } from "react-router-dom";
import { useTable } from "../context/TableCtx";

(QrScanner as any).WORKER_PATH = workerUrl;
type ScanResult = { data: string };



function extractCode(payload: string): string | null {
  try {
    // URL 形式の場合 ?code=XXXX を優先
    if (payload.startsWith("http")) {
      const u = new URL(payload);
      const byQuery = u.searchParams.get("code");
      if (byQuery) return byQuery;
      // /tables/XXXX の末尾などに載せている場合も拾う
      const last = u.pathname.split("/").filter(Boolean).pop();
      if (last && last.length >= 6) return last;
    }
    // 素のコードだけが入っている場合
    if (/^[a-zA-Z0-9_-]+$/.test(payload)) return payload;
    return null;
  } catch {
    return null;
  }
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();
  const { setTable } = useTable();

  useEffect(() => {
    if (!videoRef.current) return;

    let stopped = false;

    const start = async () => {
      try {
        const hasCam = await QrScanner.hasCamera();
        if (!hasCam) {
          setError("カメラが見つかりません。");
          return;
        }

        const onDecode = async (res: ScanResult) => {
          if (stopped) return;
          const code = extractCode(res.data);
          if (!code) {
            setError("QRの内容を解釈できませんでした。もう一度スキャンしてください。");
            return;
          }
          setScanned(code);

          // 1回で止める
          scannerRef.current?.stop();
          await scannerRef.current?.destroy();
          scannerRef.current = null;

          // バックエンドでテーブル検証
          setChecking(true);
          try {
            const t = await apiGet<TableInfo>(`/tables/${code}`);
            setTable(t);
            navigate("/order");
          } catch (e: any) {
            setError(e?.message || "テーブル確認に失敗しました。");
          } finally {
            setChecking(false);
          }
        };

        const scanner = new QrScanner(videoRef.current!, (result) => onDecode(result as ScanResult), {
          /* 連続読み取りを避けるため、スロットリング */
          returnDetailedScanResult: false,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        });
        scannerRef.current = scanner;
        await scanner.start();
      } catch (e: any) {
        setError(e?.message || "QRスキャナの起動に失敗しました。");
      }
    };

    start();

    return () => {
      stopped = true;
      (async () => {
        try {
          await scannerRef.current?.stop();
          await scannerRef.current?.destroy();
        } catch { /* noop */ }
        scannerRef.current = null;
      })();
    };
  }, [navigate, setTable]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2>QRスキャン</h2>
      <video ref={videoRef} style={{ width: "100%", borderRadius: 12, border: "1px solid #ddd" }} />
      {scanned && <div>読取コード: <b>{scanned}</b></div>}
      {checking && <div>テーブルを確認中…</div>}
      {error && (
        <div style={{ padding: 10, background: "#ffe8e8", borderRadius: 8 }}>
          {error}
        </div>
      )}
      <div>
        <p style={{ color: "#666", fontSize: 14 }}>
          QRをかざすと、自動でテーブル確認後、注文画面に遷移します。
        </p>
      </div>
    </div>
  );
}