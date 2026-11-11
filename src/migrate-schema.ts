import { runSchemaMigrations } from '@src/database/run-schema-migrations';

/** Punto de entrada de `npm run db:migrate`. */
void runSchemaMigrations(process.argv.slice(2));
