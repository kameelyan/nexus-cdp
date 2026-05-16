import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  connectionString: process.env.DATABASE_URL ?? 'postgres://nexus:nexus@localhost:5432/nexus_cdp',
});

await client.connect();

const schema = readFileSync(join(__dirname, '../../../infra/postgres/schema.sql'), 'utf8');
const seed = readFileSync(join(__dirname, '../../../infra/postgres/seed.sql'), 'utf8');

await client.query(schema);
console.log('[migrate] schema applied');

await client.query(seed);
console.log('[migrate] seed applied');

await client.end();
console.log('[migrate] done');
