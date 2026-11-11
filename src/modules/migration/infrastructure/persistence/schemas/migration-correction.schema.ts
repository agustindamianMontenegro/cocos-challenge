import { EntitySchema } from 'typeorm';
import { MigrationCorrectionRow } from '@modules/migration/infrastructure/persistence/rows/migration-correction.row';

export const MigrationCorrectionSchema = new EntitySchema<MigrationCorrectionRow>({
  name: 'MigrationCorrection',
  tableName: 'migration_corrections',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    legacyOrderId: { type: 'int' },
    field: { type: 'varchar', length: 40 },
    originalValue: { type: 'varchar', length: 40 },
    correctedValue: { type: 'varchar', length: 40 },
    reason: { type: 'text' },
    appliedAt: { type: 'timestamptz', precision: 3 },
  },
});
