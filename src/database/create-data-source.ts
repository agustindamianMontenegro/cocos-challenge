import { DataSource } from 'typeorm';
import { ENTITY_SCHEMAS } from '@src/database/entity-schemas';
import { readDatesAsUtc } from '@src/database/pg-types';
import { SCHEMA_MIGRATIONS } from '@src/database/schema-migrations';
import { requiredEnv } from '@shared/infrastructure/config/config';

/**
 * DataSource de TypeORM para PostgreSQL. synchronize está apagado: el esquema
 * solo cambia con migraciones (npm run db:migrate).
 */
export function createDataSource(url: string = requiredEnv('DATABASE_URL')): DataSource {
  readDatesAsUtc();
  return new DataSource({
    type: 'postgres',
    url,
    entities: ENTITY_SCHEMAS,
    migrations: SCHEMA_MIGRATIONS,
    synchronize: false,
    logging: false,
    // Cuánto se espera por una conexión libre del pool.
    extra: { connectionTimeoutMillis: 5_000 },
  });
}
