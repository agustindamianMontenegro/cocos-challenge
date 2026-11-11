import Decimal from 'decimal.js';

/**
 * Importe en pesos con decimales exactos. Nunca usa float.
 * Guarda la precisión completa y solo redondea al mostrar (toFixed).
 */
export class Money {
  static readonly ZERO = new Money(new Decimal(0));

  private constructor(private readonly value: Decimal) {}

  static of(amount: Decimal.Value): Money {
    return new Money(new Decimal(amount));
  }

  plus(other: Money): Money {
    return new Money(this.value.plus(other.value));
  }

  minus(other: Money): Money {
    return new Money(this.value.minus(other.value));
  }

  times(factor: Decimal.Value): Money {
    return new Money(this.value.times(factor));
  }

  dividedBy(divisor: Decimal.Value): Money {
    return new Money(this.value.dividedBy(divisor));
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  isGreaterThan(other: Money): boolean {
    return this.value.greaterThan(other.value);
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  equals(other: Money): boolean {
    return this.value.equals(other.value);
  }

  toDecimal(): Decimal {
    return this.value;
  }

  /** Precisión completa, para guardar. */
  toString(): string {
    return this.value.toString();
  }

  /** Redondeado a centavos, para mostrar. */
  toFixed(decimals = 2): string {
    return this.value.toFixed(decimals, Decimal.ROUND_HALF_EVEN);
  }
}
