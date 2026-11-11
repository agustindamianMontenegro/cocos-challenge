import { InstrumentPriceView } from '@modules/market/application/ports/in/views/instrument-price.view';

/** Una página de resultados de la búsqueda. */
export interface InstrumentPageResult {
  items: InstrumentPriceView[];
  /** Total de instrumentos que coinciden con la búsqueda, en todas las páginas. */
  total: number;
  limit: number;
  offset: number;
}
