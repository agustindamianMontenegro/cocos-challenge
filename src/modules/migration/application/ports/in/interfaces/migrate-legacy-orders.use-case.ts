import { MigrationReport } from '@modules/migration/application/ports/in/views/migration-report.view';

/** Puerto de entrada: importa orders_legacy al modelo nuevo. Se puede correr varias veces. */
export interface MigrateLegacyOrdersUseCase {
  execute(): Promise<MigrationReport>;
}

