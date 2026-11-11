import Decimal from 'decimal.js';
import { percentChange } from '@shared/domain/services/percentage';
import { Money } from '@shared/domain/value-objects/money';

/** Última cotización de un instrumento: cierre del día y cierre anterior. */
export class Quote {
  constructor(
    readonly instrumentId: number,
    readonly close: Money,
    readonly previousClose: Money | null,
    readonly date: Date | null,
  ) {}

  /** Rendimiento del día: último cierre contra el cierre anterior. */
  dailyReturnPct(): Decimal | null {
    return this.previousClose === null ? null : percentChange(this.close, this.previousClose);
  }
}
