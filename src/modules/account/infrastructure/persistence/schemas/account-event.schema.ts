import { EntitySchema } from 'typeorm';
import { AccountEventRow } from '@modules/account/infrastructure/persistence/rows/account-event.row';

export const AccountEventSchema = new EntitySchema<AccountEventRow>({
  name: 'AccountEvent',
  tableName: 'account_events',
  columns: {
    id: { type: 'bigint', primary: true, generated: 'increment' },
    userId: { type: 'int' },
    version: { type: 'int' },
    type: { type: 'varchar', length: 40 },
    schemaVersion: { type: 'int', default: 1 },
    payload: { type: 'jsonb' },
    orderId: { type: 'uuid', nullable: true },
    occurredAt: { type: 'timestamptz', precision: 3 },
  },
});
