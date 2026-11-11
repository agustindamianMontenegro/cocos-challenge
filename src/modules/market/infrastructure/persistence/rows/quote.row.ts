/** Fila de la consulta de última cotización sobre marketdata. NUMERIC llega como texto. */
export interface QuoteRow {
  instrumentId: number;
  close: string;
  previousClose: string | null;
  date: Date | null;
}
