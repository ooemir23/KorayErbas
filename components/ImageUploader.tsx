"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/imageCompression";

interface ImageUploaderProps {
  /** Mevcut görsel URL'i (düzenleme için). */
  initialUrl?: string | null;
  /** Sıkıştırılıp Blob'a yüklendikten sonra dönen URL. */
  onUploaded: (url: string) => void;
}

type Status = "idle" | "compressing" | "uploading" | "done" | "error";

/**
 * Client-side sıkıştırma → /api/upload (server, Blob token) → URL.
 * 800x800 / WebP / <100KB hedefiyle çalışır.
 */
export function ImageUploader({ initialUrl, onUploaded }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      // 1) Sıkıştır (frontend)
      setStatus("compressing");
      setProgress("Görsel sıkıştırılıyor…");
      const compressed = await compressImage(file, {
        maxWidthOrHeight: 800,
        maxSizeMB: 0.1, // 100 KB
      });

      // Önizleme
      setPreview(URL.createObjectURL(compressed));

      // 2) Sunucuya yükle (Blob token server'da)
      setStatus("uploading");
      setProgress("Vercel Blob'a yükleniyor…");
      const fd = new FormData();
      fd.append("file", compressed);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Yükleme başarısız.");
      }
      const { url } = await res.json();
      onUploaded(url);
      setPreview(url);
      setStatus("done");
      setProgress("");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Görsel yüklenemedi.");
      setStatus("error");
      setProgress("");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Önizleme"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
              🖼️
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
          {progress && (
            <p className="mt-2 text-xs text-slate-500">{progress}</p>
          )}
          {status === "done" && (
            <p className="mt-2 text-xs font-medium text-brand-600">
              ✓ Görsel yüklendi.
            </p>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
