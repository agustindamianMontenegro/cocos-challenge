import { MigratedOrder } from '@modules/migration/application/ports/out/records/migrated-order.record';
import { LegacyOrder } from '@modules/migration/domain/types/legacy-order.interface';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/** Puerto de salida: lee orders_legacy y escribe las órdenes migradas y sus correcciones. */
export interface LegacyOrdersRepository {
  /** Por fecha y, si coinciden, por id. Lanza MigrationError si una fila tiene columnas vacías. */
  loadLegacyOrders(): Promise<LegacyOrder[]>;

  hasMigratedOrders(tx: Transaction): Promise<boolean>;

  /** Las históricas usan la fecha original como creación y última modificación. */
  saveMigratedOrder(tx: Transaction, order: MigratedOrder): Promise<void>;

  saveCorrection(tx: Transaction, order: MigratedOrder): Promise<void>;
}

