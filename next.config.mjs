/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Vercel Blob CDN alanları
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
