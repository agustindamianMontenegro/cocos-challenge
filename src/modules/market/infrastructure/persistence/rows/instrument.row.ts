/** Fila de instruments: en database.sql todas las columnas aceptan NULL. */
export interface InstrumentRow {
  id: number;
  ticker: string | null;
  name: string | null;
  type: string | null;
}
