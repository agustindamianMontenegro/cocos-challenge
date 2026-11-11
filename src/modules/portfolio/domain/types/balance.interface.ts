import { Money } from '@shared/domain/value-objects/money';

/** Saldo total, comprometido y disponible. */
export interface Balance {
  total: Money;
  reserved: Money;
  available: Money;
}
