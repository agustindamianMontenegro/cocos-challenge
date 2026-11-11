import Decimal from 'decimal.js';
import { Money } from '@shared/domain/value-objects/money';

/** Instrumento con su última cotización, tal como lo ven los otros módulos y la API. */
export interface InstrumentPriceView {
  id: number;
  ticker: string;
  name: string;
  type: string;
  /** false para los pesos (tipo MONEDA): se muestran como saldo, no se operan. */
  tradable: boolean;
  lastPrice: Money | null;
  previousClose: Money | null;
  dailyReturnPct: Decimal | null;
}
