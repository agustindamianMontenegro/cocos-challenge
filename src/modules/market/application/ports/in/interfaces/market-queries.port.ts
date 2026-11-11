import { InstrumentPriceView } from '@modules/market/application/ports/in/views/instrument-price.view';

/** Puerto de entrada público del módulo Market, para Trading y Portfolio. */
export interface MarketQueriesPort {
  /** Lanza InstrumentNotFoundError si el instrumento no existe. */
  getInstrumentPrice(instrumentId: number): Promise<InstrumentPriceView>;

  /** Los que no existen no aparecen en el resultado. */
  findInstrumentPrices(instrumentIds: readonly number[]): Promise<Map<number, InstrumentPriceView>>;
}

