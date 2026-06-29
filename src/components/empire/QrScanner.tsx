import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onDetect: (text: string) => void;
  onClose?: () => void;
};

const ELEMENT_ID = "empire-qr-reader";

export function QrScanner({ onDetect, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);

  // Start camera on mount
  useEffect(() => {
    let mounted = true;
    const start = async () => {
      setStatus("starting");
      setError(null);
      try {
        const instance = new Html5Qrcode(ELEMENT_ID, { verbose: false });
        scannerRef.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (!mounted) return;
            instance.stop().catch(() => {});
            onDetect(decodedText);
          },
          () => {
            /* ignore per-frame errors */
          },
        );
        if (mounted) setStatus("running");
      } catch (e) {
        if (!mounted) return;
        setStatus("error");
        setError(
          e instanceof Error
            ? e.message
            : "Tidak bisa buka kamera. Coba upload gambar QR saja.",
        );
      }
    };
    start();
    return () => {
      mounted = false;
      const s = scannerRef.current;
      if (s) {
        Promise.resolve(s.stop())
          .catch(() => {})
          .finally(() => {
            try { s.clear(); } catch { /* ignore */ }
          });
      }
    };
  }, [onDetect]);

  const handleFile = async (file: File) => {
    setDecoding(true);
    setError(null);
    try {
      // Stop camera while decoding image
      const s = scannerRef.current;
      if (s && status === "running") {
        try { await s.stop(); } catch { /* ignore */ }
      }
      const instance = scannerRef.current ?? new Html5Qrcode(ELEMENT_ID, { verbose: false });
      scannerRef.current = instance;
      const decoded = await instance.scanFile(file, false);
      onDetect(decoded);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Tidak terbaca: ${e.message}`
          : "Gambar tidak terbaca sebagai QR.",
      );
    } finally {
      setDecoding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
        <div id={ELEMENT_ID} className="size-full [&_video]:size-full [&_video]:object-cover" />
        {status !== "running" && !decoding && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 text-sm gap-2 bg-black/60">
            {status === "starting" && (
              <>
                <Loader2 className="size-6 animate-spin" />
                <span>Membuka kamera…</span>
              </>
            )}
            {status === "error" && (
              <>
                <Camera className="size-6 opacity-60" />
                <span className="px-6 text-center text-xs">{error}</span>
              </>
            )}
          </div>
        )}
        {decoding && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm gap-2">
            <Loader2 className="size-5 animate-spin" /> Membaca QR…
          </div>
        )}
      </div>

      {error && status === "running" && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={decoding}
        >
          <ImageIcon className="size-4" /> Upload Gambar QR
        </Button>
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Tutup">
            <X className="size-4" />
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        Arahkan kamera ke QR absen — link otomatis terkirim.
      </p>
    </div>
  );
}
