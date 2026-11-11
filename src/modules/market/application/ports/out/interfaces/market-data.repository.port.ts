import { Instrument } from '@modules/market/domain/types/instrument.interface';
import { Quote } from '@modules/market/domain/value-objects/quote';

/** Puerto de salida: lectura de instrumentos y cotizaciones. */
export interface MarketDataRepository {
  /** Coincidencia parcial por ticker o nombre, sin distinguir mayúsculas y sin los pesos. */
  searchInstruments(term: string, limit: number): Promise<Instrument[]>;

  findInstruments(ids: readonly number[]): Promise<Map<number, Instrument>>;

  /** Última cotización con cierre de cada instrumento (fecha más reciente; a igual fecha, id mayor). */
  latestQuotes(ids: readonly number[]): Promise<Map<number, Quote>>;
}

