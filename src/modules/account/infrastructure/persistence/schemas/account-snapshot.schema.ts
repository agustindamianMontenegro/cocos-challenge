import { EntitySchema } from 'typeorm';
import { AccountSnapshotRow } from '@modules/account/infrastructure/persistence/rows/account-snapshot.row';

export const AccountSnapshotSchema = new EntitySchema<AccountSnapshotRow>({
  name: 'AccountSnapshot',
  tableName: 'account_snapshots',
  columns: {
    userId: { type: 'int', primary: true },
    version: { type: 'int', primary: true },
    schemaVersion: { type: 'int', default: 1 },
    state: { type: 'jsonb' },
    createdAt: { type: 'timestamptz', precision: 3 },
  },
});
