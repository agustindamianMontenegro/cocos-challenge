import { Instrument } from '@modules/market/domain/types/instrument.interface';

/** Una página de instrumentos y el total que coincide con la búsqueda. */
export interface InstrumentSearchRecord {
  instruments: Instrument[];
  total: number;
}
