import { EntitySchema } from 'typeorm';
import { UserRow } from '@modules/account/infrastructure/persistence/rows/user.row';

/** Tabla original de database.sql: columnas en minúsculas (accountNumber -> accountnumber). */
export const UserSchema = new EntitySchema<UserRow>({
  name: 'User',
  tableName: 'users',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    email: { type: 'varchar', length: 255, nullable: true },
    accountNumber: { type: 'varchar', length: 20, nullable: true, name: 'accountnumber' },
  },
});
