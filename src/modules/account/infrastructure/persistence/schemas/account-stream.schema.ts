import { EntitySchema } from 'typeorm';
import { AccountStreamRow } from '@modules/account/infrastructure/persistence/rows/account-stream.row';

export const AccountStreamSchema = new EntitySchema<AccountStreamRow>({
  name: 'AccountStream',
  tableName: 'account_streams',
  columns: {
    userId: { type: 'int', primary: true },
    version: { type: 'int', default: 0 },
  },
});
