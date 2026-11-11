/** Saldo y tenencias por instrumento. */
export interface Balances {
  cash: string;
  holdings: Record<number, number>;
}
