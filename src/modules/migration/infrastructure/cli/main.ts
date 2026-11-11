import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MigrateLegacyOrdersUseCase } from '@modules/migration/application/ports/in/interfaces/migrate-legacy-orders.use-case';
import { MIGRATE_LEGACY_ORDERS } from '@modules/migration/application/ports/in/tokens';
import { MigrationReport } from '@modules/migration/application/ports/in/views/migration-report.view';
import { MigrationModule } from '@modules/migration/migration.module';

/** npm run migrate:legacy — adaptador de línea de comandos del puerto de entrada. */
export async function runMigrationCli(): Promise<void> {
  const app = await NestFactory.createApplicationContext(MigrationModule, { logger: false });
  try {
    print(await app.get<MigrateLegacyOrdersUseCase>(MIGRATE_LEGACY_ORDERS).execute());
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

function print(report: MigrationReport): void {
  console.log(
    report.alreadyMigrated
      ? 'Ya estaba migrado: no se cambió nada.'
      : `Órdenes importadas: ${report.importedOrders}. Correcciones aplicadas: ${report.corrections}.`,
  );
  console.log('\nConciliación (original = sumar todas las FILLED tal cual; corregido = cuenta migrada):');
  report.accounts.forEach(({ userId, original, corrected }) => {
    console.log(`\nUsuario ${userId}`);
    console.log(`  Saldo original:  $${original.cash}   tenencias ${JSON.stringify(original.holdings)}`);
    console.log(`  Saldo corregido: $${corrected.cash}   tenencias ${JSON.stringify(corrected.holdings)}`);
    console.log(`  Comprometido:    $${corrected.reserved}   disponible $${corrected.available}`);
  });
}
