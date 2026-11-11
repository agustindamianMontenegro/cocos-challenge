import { DataSource } from 'typeorm';
import { LegacyOrdersRepository } from '@modules/migration/application/ports/out/interfaces/legacy-orders.repository.port';
import { MigratedOrder } from '@modules/migration/application/ports/out/records/migrated-order.record';
import { MigrationError } from '@modules/migration/domain/errors/migration.error';
import { LegacyOrder } from '@modules/migration/domain/types/legacy-order.interface';
import { OrderLegacyRow } from '@modules/migration/infrastructure/persistence/rows/order-legacy.row';
import { MigrationCorrectionSchema } from '@modules/migration/infrastructure/persistence/schemas/migration-correction.schema';
import { OrderLegacySchema } from '@modules/migration/infrastructure/persistence/schemas/order-legacy.schema';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';
import { Money } from '@shared/domain/value-objects/money';
import { asEntityManager } from '@shared/infrastructure/persistence/typeorm-transaction';

/**
 * La tabla orders es de Trading: la migración no usa su mapeo, escribe con SQL explícito.
 * Las históricas usan la fecha original como creación y última modificación.
 */
const INSERT_MIGRATED_ORDER_SQL = `
  INSERT INTO orders ("id", "legacyOrderId", "userId", "instrumentId", "side", "type", "size", "price",
                      "status", "rejectionReason", "requestHash", "createdAt", "updatedAt")
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $11)`;

/** Adaptador del puerto LegacyOrdersRepository: orders_legacy, orders y migration_corrections. */
export class TypeOrmLegacyOrdersRepository implements LegacyOrdersRepository {
  constructor(private readonly dataSource: DataSource) {}

  async loadLegacyOrders(): Promise<LegacyOrder[]> {
    const rows = await this.dataSource.manager.find(OrderLegacySchema, { order: { datetime: 'ASC', id: 'ASC' } });
    return rows.map(toLegacyOrder);
  }

  async hasMigratedOrders(tx: Transaction): Promise<boolean> {
    const rows: unknown[] = await asEntityManager(tx).query('SELECT 1 FROM orders WHERE "legacyOrderId" IS NOT NULL LIMIT 1');
    return rows.length > 0;
  }

  async saveMigratedOrder(tx: Transaction, order: MigratedOrder): Promise<void> {
    const { legacy } = order;
    await asEntityManager(tx).query(INSERT_MIGRATED_ORDER_SQL, [
      order.orderId,
      legacy.id,
      legacy.userId,
      legacy.instrumentId,
      legacy.side,
      legacy.type,
      legacy.size,
      legacy.price.toString(),
      order.status,
      order.rejectionReason,
      legacy.datetime,
    ]);
  }

  async saveCorrection(tx: Transaction, order: MigratedOrder): Promise<void> {
    const { correction, legacy } = order;
    if (!correction) {
      return;
    }
    await asEntityManager(tx).insert(MigrationCorrectionSchema, {
      legacyOrderId: legacy.id,
      field: correction.field,
      originalValue: correction.originalValue,
      correctedValue: correction.correctedValue,
      reason: correction.reason,
      appliedAt: new Date(),
    });
  }
}

/** En la tabla original todas las columnas aceptan NULL: una fila incompleta frena la migración. */
function toLegacyOrder(row: OrderLegacyRow): LegacyOrder {
  const { instrumentId, userId, size, price, type, side, status, datetime } = row;
  if ([instrumentId, userId, size, price, type, side, status, datetime].some((value) => value === null)) {
    throw new MigrationError(`La orden ${row.id} tiene columnas vacías: no se puede importar.`);
  }
  return {
    id: row.id,
    instrumentId: instrumentId!,
    userId: userId!,
    size: size!,
    price: Money.of(price!),
    type: type!,
    side: side!,
    status: status!,
    datetime: datetime!,
  };
}
