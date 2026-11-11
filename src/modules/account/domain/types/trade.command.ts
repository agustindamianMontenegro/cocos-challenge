import { Money } from '@shared/domain/value-objects/money';

/** Datos de una compra o venta que se ejecuta sobre la cuenta. */
export interface TradeCommand {
  orderId: string;
  instrumentId: number;
  quantity: number;
  price: Money;
}
