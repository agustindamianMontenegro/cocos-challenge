import { Money } from '@shared/domain/value-objects/money';
import { Balance } from './balance.interface';
import { PositionValuation } from './position-valuation.interface';

/** Valuación completa de la cuenta. */
export interface PortfolioValuation {
  /** Saldo total más el valor de las posiciones. Null si falta algún precio: no se inventan. */
  totalValue: Money | null;
  valuationComplete: boolean;
  balance: Balance;
  positions: PositionValuation[];
}
