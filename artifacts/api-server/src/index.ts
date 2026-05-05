import "dotenv/config";
import app from "./app";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

// --- VERİTABANI OLUŞTURMA BLOĞU ---
const setupDatabase = async () => {
  try {
    console.log("Database tabloları kontrol ediliyor...");
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS closet_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        color TEXT NOT NULL,
        brand TEXT,
        season TEXT NOT NULL DEFAULT 'all',
        occasion TEXT NOT NULL DEFAULT 'casual',
        image_uri TEXT,
        notes TEXT,
        favorite INTEGER NOT NULL DEFAULT 0,
        wear_count INTEGER NOT NULL DEFAULT 0,
        last_worn TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS outfits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        item_ids TEXT NOT NULL,
        occasion TEXT NOT NULL,
        season TEXT NOT NULL,
        notes TEXT,
        favorite INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS analyze_strikes (
        ip TEXT PRIMARY KEY,
        strikes INTEGER NOT NULL DEFAULT 0,
        blocked_until TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Veritabanı tabloları hazır!");
  } catch (error) {
    console.error("❌ Veritabanı kurulum hatası:", error);
  }
};

setupDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
  });
});
