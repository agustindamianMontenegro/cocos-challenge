import { EntitySchema } from 'typeorm';
import { OrderLegacyRow } from '@modules/migration/infrastructure/persistence/rows/order-legacy.row';

/** Columnas en minúsculas, como las dejó database.sql. */
export const OrderLegacySchema = new EntitySchema<OrderLegacyRow>({
  name: 'OrderLegacy',
  tableName: 'orders_legacy',
  columns: {
    id: { type: 'int', primary: true },
    instrumentId: { type: 'int', nullable: true, name: 'instrumentid' },
    userId: { type: 'int', nullable: true, name: 'userid' },
    size: { type: 'int', nullable: true },
    price: { type: 'numeric', precision: 10, scale: 2, nullable: true },
    type: { type: 'varchar', length: 10, nullable: true },
    side: { type: 'varchar', length: 10, nullable: true },
    status: { type: 'varchar', length: 20, nullable: true },
    datetime: { type: 'timestamp', nullable: true },
  },
});
