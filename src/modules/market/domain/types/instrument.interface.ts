/** Instrumento operable (o los pesos, de tipo MONEDA). */
export interface Instrument {
  id: number;
  ticker: string;
  name: string;
  type: string;
}
