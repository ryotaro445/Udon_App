// src/types/qr-scanner.d.ts
// src/types/qr-scanner.d.ts
declare module "qr-scanner" {
  export default class QrScanner {
    constructor(
      video: HTMLVideoElement,
      onDecode: (result: { data: string; cornerPoints?: { x: number; y: number }[] }) => void,
      options?: {
        preferredCamera?: "user" | "environment";
        highlightScanRegion?: boolean;
        highlightCodeOutline?: boolean;
        returnDetailedScanResult?: boolean;
      }
    );
    start(): Promise<void>;
    stop(): void;
    destroy(): void;

    // static utilities
    static hasCamera(): Promise<boolean>;
    static readonly DEFAULT_CANVAS_SIZE: number;
    static readonly NO_QR_CODE_FOUND: string;
  }
}

  namespace QrScanner {
    export interface ScanResult {
      data: string;
      cornerPoints?: { x: number; y: number }[];
    }

    export interface Options {
      preferredCamera?: "user" | "environment";
      highlightScanRegion?: boolean;
      highlightCodeOutline?: boolean;
      returnDetailedScanResult?: boolean;
    }
  }
