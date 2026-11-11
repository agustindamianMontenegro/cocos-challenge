import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { createDataSource } from '@src/database/create-data-source';
import { testDatabaseUrl } from './test-env';

const DATABASE_SQL = join(__dirname, '..', '..', '..', 'database', 'database.sql');

/** Tablas que modifican las pruebas. Las del dataset original quedan intactas. */
const MUTABLE_TABLES = [
  'account_snapshots',
  'account_events',
  'account_streams',
  'orders',
  'migration_corrections',
];

/**
 * Recrea la base de prueba desde cero: database.sql del challenge (tablas y datos)
 * y después las migraciones de TypeORM, igual que `npm run db:migrate`.
 */
export async function recreateTestDatabase(): Promise<void> {
  await createDatabaseIfMissing();
  await withClient(async (client) => {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await client.query(readFileSync(DATABASE_SQL, 'utf8'));
  });
  await runSchemaMigrations();
}

export async function clearMutableTables(): Promise<void> {
  await withClient((client) => client.query(`TRUNCATE ${MUTABLE_TABLES.join(', ')} RESTART IDENTITY`));
}

export async function withClient<T>(work: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

async function runSchemaMigrations(): Promise<void> {
  const dataSource = await createDataSource(testDatabaseUrl()).initialize();
  try {
    await dataSource.runMigrations({ transaction: 'each' });
  } finally {
    await dataSource.destroy();
  }
}

async function createDatabaseIfMissing(): Promise<void> {
  const url = new URL(testDatabaseUrl());
  const name = decodeURIComponent(url.pathname.slice(1));
  url.pathname = '/postgres';
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
    }
  } finally {
    await admin.end();
  }
}
