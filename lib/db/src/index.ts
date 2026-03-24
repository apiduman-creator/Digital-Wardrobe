import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema/index'; // Şema dosyanın adından emin ol
import path from 'path';

// Sürecin çalıştığı klasörü baz alarak yolu oluşturur
const dbPath = path.resolve(process.cwd(), '../../local.db');

console.log(`Checking Database at: ${dbPath}`); // Terminalde yolu görelim

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
