import 'dotenv/config';
import { createDataSource } from '@src/database/create-data-source';

/**
 * npm run db:migrate — aplica las migraciones pendientes del esquema.
 * npm run db:migrate -- --revert — revierte la última.
 */
export async function runSchemaMigrations(argv: readonly string[]): Promise<void> {
  const dataSource = await createDataSource().initialize();
  try {
    if (argv.includes('--revert')) {
      await dataSource.undoLastMigration({ transaction: 'each' });
      console.log('Se revirtió la última migración.');
      return;
    }
    const applied = await dataSource.runMigrations({ transaction: 'each' });
    console.log(applied.length === 0 ? 'No había migraciones pendientes.' : `Migraciones aplicadas: ${applied.map((m) => m.name).join(', ')}.`);
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}
