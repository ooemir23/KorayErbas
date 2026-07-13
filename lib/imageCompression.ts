// Tarayıcı tarafı görsel sıkıştırma.
// browser-image-compression kullanır. WebP/JPEG'e dönüştürerek
// 800x800 sınırına ve ~100KB altına indirir.

import imageCompression from "browser-image-compression";

export interface CompressOptions {
  maxSizeMB?: number; // hedef maksimum boyut
  maxWidthOrHeight?: number; // en uzun kenar
}

/**
 * Verilen File'ı sıkıştırır ve optimize edilmiş bir File döndürür.
 * - Maks. 800x800
 * - Hedef < 100 KB (0.1 MB)
 * - WebP (destekleniyorsa), değilse JPEG
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 0.1, // 100 KB
    maxWidthOrHeight = 800,
  } = opts;

  const useWebP = supportsWebP();

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: useWebP ? "image/webp" : "image/jpeg",
    initialQuality: 0.8,
    alwaysKeepResolution: false,
  };

  try {
    const compressed = await imageCompression(file, options);
    const ext = useWebP ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([compressed], `${baseName}.${ext}`, {
      type: options.fileType,
    });
  } catch (err) {
    console.error("[compressImage] sıkıştırma başarısız, orijinal döndürülüyor:", err);
    return file;
  }
}

// WebP üretimini test eder (cache'ler).
let _webpSupport: boolean | null = null;
function supportsWebP(): boolean {
  if (_webpSupport !== null) return _webpSupport;
  if (typeof document === "undefined") return true; // SSR güvenliği
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  _webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return _webpSupport;
}
