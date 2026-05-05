import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema/index';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../../local.db');

console.log(`Checking Database at: ${dbPath}`);

const client = createClient({ url: `file:${dbPath}` });
export const db = drizzle(client, { schema });
