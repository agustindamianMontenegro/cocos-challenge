import Decimal from 'decimal.js';
import { Money } from '@shared/domain/value-objects/money';

/** Una posición valuada al último cierre, con su rendimiento. */
export interface PositionValuation {
  instrumentId: number;
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: Money;
  lastPrice: Money | null;
  marketValue: Money | null;
  totalReturnPct: Decimal | null;
  dailyReturnPct: Decimal | null;
}
