import { Money } from '@shared/domain/value-objects/money';

/** Saldo total, comprometido en LIMIT pendientes y disponible para operar. */
export interface AccountBalance {
  total: Money;
  reserved: Money;
  available: Money;
}
