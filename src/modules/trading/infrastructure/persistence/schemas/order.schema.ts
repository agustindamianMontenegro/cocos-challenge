import { EntitySchema } from 'typeorm';
import { OrderRow } from '@modules/trading/infrastructure/persistence/rows/order.row';

export const OrderSchema = new EntitySchema<OrderRow>({
  name: 'Order',
  tableName: 'orders',
  columns: {
    id: { type: 'uuid', primary: true },
    legacyOrderId: { type: 'int', nullable: true, unique: true },
    userId: { type: 'int' },
    instrumentId: { type: 'int' },
    side: { type: 'varchar', length: 10 },
    type: { type: 'varchar', length: 10 },
    size: { type: 'int' },
    price: { type: 'numeric', precision: 18, scale: 2 },
    status: { type: 'varchar', length: 20 },
    rejectionReason: { type: 'varchar', length: 40, nullable: true },
    requestHash: { type: 'varchar', length: 64, nullable: true },
    createdAt: { type: 'timestamptz', precision: 3 },
    updatedAt: { type: 'timestamptz', precision: 3 },
  },
});
