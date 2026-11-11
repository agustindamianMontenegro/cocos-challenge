import { InstrumentPriceView } from '@modules/market/application/ports/in/views/instrument-price.view';

/** Puerto de entrada: búsqueda por ticker o nombre (lanza InvalidSearchError si viene vacía). */
export interface SearchInstrumentsUseCase {
  execute(search: string | undefined): Promise<InstrumentPriceView[]>;
}

