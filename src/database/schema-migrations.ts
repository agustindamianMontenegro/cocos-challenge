import { Baseline1730000000000 } from '@src/database/migrations/1730000000000-baseline';
import { AccountEventSourcing1730000000001 } from '@src/database/migrations/1730000000001-account-event-sourcing';
import { EventSchemaVersion1730000000002 } from '@src/database/migrations/1730000000002-event-schema-version';

/** Migraciones del esquema, en orden. TypeORM registra las aplicadas en la tabla `migrations`. */
export const SCHEMA_MIGRATIONS = [Baseline1730000000000, AccountEventSourcing1730000000001, EventSchemaVersion1730000000002];
