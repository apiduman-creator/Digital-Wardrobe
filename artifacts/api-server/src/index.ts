import app from "./app";
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from "@workspace/db"; // Veritabanı bağlantısını workspace paketi üzerinden import et
import path from 'path';

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

// --- VERİTABANI OLUŞTURMA BLOĞU ---
const setupDatabase = async () => {
  try {
    console.log("Database tabloları kontrol ediliyor...");
    // migrationsFolder yolu: lib/db/drizzle klasörünü işaret etmeli
    await migrate(db, { 
      migrationsFolder: path.resolve(process.cwd(), "../../lib/db/drizzle") 
    });
    console.log("✅ Veritabanı tabloları hazır!");
  } catch (error) {
    console.error("❌ Veritabanı kurulum hatası:", error);
  }
};

// Sunucuyu başlatmadan önce tabloları kur
setupDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
  });
});