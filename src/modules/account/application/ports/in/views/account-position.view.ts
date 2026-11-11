import { Money } from '@shared/domain/value-objects/money';

/** Tenencia de un instrumento con su costo. */
export interface AccountPosition {
  instrumentId: number;
  quantity: number;
  /** Costo de las acciones que quedan (cantidad por precio promedio de compra). */
  cost: Money;
}
