import { AccountEventSchema } from '@modules/account/infrastructure/persistence/schemas/account-event.schema';
import { AccountSnapshotSchema } from '@modules/account/infrastructure/persistence/schemas/account-snapshot.schema';
import { AccountStreamSchema } from '@modules/account/infrastructure/persistence/schemas/account-stream.schema';
import { UserSchema } from '@modules/account/infrastructure/persistence/schemas/user.schema';
import { InstrumentSchema } from '@modules/market/infrastructure/persistence/schemas/instrument.schema';
import { MigrationCorrectionSchema } from '@modules/migration/infrastructure/persistence/schemas/migration-correction.schema';
import { OrderLegacySchema } from '@modules/migration/infrastructure/persistence/schemas/order-legacy.schema';
import { OrderSchema } from '@modules/trading/infrastructure/persistence/schemas/order.schema';

/** Tablas que mapea TypeORM. Cada módulo define las suyas en su infraestructura. */
export const ENTITY_SCHEMAS = [
  UserSchema,
  AccountStreamSchema,
  AccountEventSchema,
  AccountSnapshotSchema,
  InstrumentSchema,
  OrderSchema,
  OrderLegacySchema,
  MigrationCorrectionSchema,
];
