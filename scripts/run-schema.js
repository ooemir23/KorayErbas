// Veritabanı şemasını çalıştırır (npm run db:setup).
// .env.local içindeki POSTGRES_* değerlerini okur.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Pool } from "@vercel/postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "schema.sql");
const sqlText = readFileSync(schemaPath, "utf8");

// Vercel Postgres SDK'sı process.env'i otomatik okur; dotenv'e ihtiyaç var çünkü
// next dışında node script'iyiz. next.config / next dev .env.local'ı yükler ama
// node script'lerde bunu manuel yapmamız gerek.
import("dotenv")
  .then(async ({ config }) => {
    config();
    const missing = [
      "POSTGRES_URL",
      "POSTGRES_HOST",
      "POSTGRES_USER",
      "POSTGRES_PASSWORD",
      "POSTGRES_DATABASE",
    ].filter((k) => !process.env[k]);

    if (missing.length) {
      console.error(
        `\n❌ Eksik ortam değişkenleri: ${missing.join(", ")}\n` +
          `   .env.local dosyanızı kontrol edin.\n`
      );
      process.exit(1);
    }

    const pool = new Pool();
    const client = await pool.connect();
    try {
      console.log("▶ Veritabanına bağlanıldı, şema çalıştırılıyor...");
      await client.query(sqlText);
      console.log("✅ Şema başarıyla uygulandı.");
    } catch (err) {
      console.error("❌ Şema çalıştırılamadı:", err);
      process.exitCode = 1;
    } finally {
      client.release();
      await pool.end();
    }
  })
  .catch(() => {
    console.error(
      "❌ 'dotenv' paketi bulunamadı. Lütfen `npm i -D dotenv` çalıştırın."
    );
    process.exit(1);
  });
