import Decimal from 'decimal.js';
import { Money } from '@shared/domain/value-objects/money';

/** Variación porcentual de `base` a `current`. Si la base es cero, no hay variación que calcular. */
export function percentChange(current: Money, base: Money): Decimal | null {
  if (base.isZero()) {
    return null;
  }
  return current.toDecimal().dividedBy(base.toDecimal()).minus(1).times(100);
}

/** Porcentaje con dos decimales, para mostrar. */
export function formatPercent(value: Decimal | null): string | null {
  return value === null ? null : value.toFixed(2, Decimal.ROUND_HALF_EVEN);
}
