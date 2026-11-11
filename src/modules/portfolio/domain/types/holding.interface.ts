import { Money } from '@shared/domain/value-objects/money';

/** Una tenencia con su costo y, si la hay, su última cotización. */
export interface Holding {
  instrumentId: number;
  ticker: string;
  name: string;
  quantity: number;
  cost: Money;
  lastPrice: Money | null;
  previousClose: Money | null;
}
