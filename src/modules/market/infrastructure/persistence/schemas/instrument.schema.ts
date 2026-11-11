import { EntitySchema } from 'typeorm';
import { InstrumentRow } from '@modules/market/infrastructure/persistence/rows/instrument.row';

/** Tabla original de database.sql (columnas que aceptan NULL). */
export const InstrumentSchema = new EntitySchema<InstrumentRow>({
  name: 'Instrument',
  tableName: 'instruments',
  columns: {
    id: { type: 'int', primary: true, generated: 'increment' },
    ticker: { type: 'varchar', length: 10, nullable: true },
    name: { type: 'varchar', length: 255, nullable: true },
    type: { type: 'varchar', length: 10, nullable: true },
  },
});
