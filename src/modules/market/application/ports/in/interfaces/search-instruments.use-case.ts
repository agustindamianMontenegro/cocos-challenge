import { SearchInstrumentsCommand } from '@modules/market/application/ports/in/commands/search-instruments.command';
import { InstrumentPageResult } from '@modules/market/application/ports/in/results/instrument-page.result';

/**
 * Puerto de entrada: búsqueda paginada por ticker o nombre.
 * Lanza InvalidSearchError si la búsqueda viene vacía e InvalidPageError si la página no es válida.
 */
export interface SearchInstrumentsUseCase {
  execute(command: SearchInstrumentsCommand): Promise<InstrumentPageResult>;
}
