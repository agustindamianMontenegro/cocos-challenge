import { Money } from '@shared/domain/value-objects/money';

/** Una fila de orders_legacy, ya validada (en la tabla original todas las columnas aceptan NULL). */
export interface LegacyOrder {
  id: number;
  instrumentId: number;
  userId: number;
  size: number;
  price: Money;
  type: string;
  side: string;
  status: string;
  datetime: Date;
}
