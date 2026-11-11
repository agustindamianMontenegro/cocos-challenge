import { PageOptions } from '@shared/application/ports/out/options/page.options';
import { InstrumentSearchRecord } from '@modules/market/application/ports/out/records/instrument-search.record';
import { Instrument } from '@modules/market/domain/types/instrument.interface';
import { Quote } from '@modules/market/domain/value-objects/quote';

/** Puerto de salida: lectura de instrumentos y cotizaciones. */
export interface MarketDataRepository {
  /**
   * Coincidencia parcial por ticker o nombre, sin distinguir mayúsculas y sin los pesos,
   * ordenada por ticker. Devuelve la página pedida y el total de coincidencias.
   */
  searchInstruments(term: string, page: PageOptions): Promise<InstrumentSearchRecord>;

  findInstruments(ids: readonly number[]): Promise<Map<number, Instrument>>;

  /** Última cotización con cierre de cada instrumento (fecha más reciente; a igual fecha, id mayor). */
  latestQuotes(ids: readonly number[]): Promise<Map<number, Quote>>;
}
