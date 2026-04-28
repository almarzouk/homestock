"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, AlertTriangle } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

type ScannerInstance = {
  start: (
    config: { facingMode: string },
    options: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (text: string) => void,
    onError: () => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scannerRef = useRef<ScannerInstance | null>(null);
  const hasScannedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      void cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    setStatus("starting");
    setErrorMsg(null);
    hasScannedRef.current = false;

    // Small delay to ensure the DOM element is fully rendered and visible
    await new Promise((r) => setTimeout(r, 100));

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      
      const scanner = new Html5Qrcode("hs-qr-reader") as unknown as ScannerInstance;
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            void cleanup().then(() => {
              if (isMountedRef.current) {
                setStatus("idle");
                onScan(decodedText.trim());
              }
            });
          }
        },
        () => {
          // scan frame errors are normal, ignore
        }
      );

      if (isMountedRef.current) setStatus("scanning");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      let userMsg = "Kamerafehler. Bitte prüfen Sie die Berechtigungen.";

      if (
        msg.includes("NotAllowed") ||
        msg.includes("Permission") ||
        msg.includes("permission")
      ) {
        userMsg = "Kamerazugriff verweigert. Bitte erlauben Sie den Kamerazugriff in den Browser-Einstellungen.";
      } else if (msg.includes("NotFound") || msg.includes("not found")) {
        userMsg = "Keine Kamera gefunden. Bitte verbinden Sie eine Kamera.";
      } else if (msg.includes("NotReadable") || msg.includes("in use")) {
        userMsg = "Kamera wird bereits von einer anderen Anwendung verwendet.";
      }

      if (isMountedRef.current) {
        setStatus("error");
        setErrorMsg(userMsg);
      }
      await cleanup();
    }
  };

  const stopScanner = async () => {
    await cleanup();
    if (isMountedRef.current) setStatus("idle");
  };

  const isScanning = status === "scanning";
  const isStarting = status === "starting";

  return (
    <div className="space-y-3">
      {/* Camera viewport — always in DOM so html5-qrcode can find it */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-900">
        {/* The actual scanner target — must never be display:none */}
        <div
          id="hs-qr-reader"
          className="w-full"
          style={{ minHeight: isScanning || isStarting ? 300 : 0 }}
        />

        {/* Placeholder overlay when not scanning */}
        {!isScanning && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-2xl min-h-[200px]">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3">
              <Camera className="h-10 w-10 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Kamera bereit</p>
            <p className="text-xs text-gray-400 mt-1">
              Klicken Sie auf „Kamera starten"
            </p>
          </div>
        )}

        {/* Loading overlay */}
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-2xl">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Kamera wird gestartet...</p>
            </div>
          </div>
        )}

        {/* Scan frame overlay when scanning */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
              {/* Scan line animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-blue-400/80 animate-scan-line top-1/2" />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {status === "error" && errorMsg && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Control button */}
      {!isScanning ? (
        <button
          onClick={startScanner}
          disabled={isStarting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
        >
          {isStarting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          {isStarting ? "Wird gestartet..." : "Kamera starten"}
        </button>
      ) : (
        <button
          onClick={stopScanner}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
        >
          <CameraOff className="h-5 w-5" />
          Kamera stoppen
        </button>
      )}

      {/* Scanning hint */}
      {isScanning && (
        <p className="text-center text-xs text-gray-500">
          Halten Sie den Barcode in den Rahmen
        </p>
      )}
    </div>
  );
}
