import { OrderType, TradeSide } from '@modules/trading/domain/types/order.types';
import { Money } from '@shared/domain/value-objects/money';

/** Lo que pide el usuario: cantidad (size) o monto en pesos (amount); price solo en LIMIT. */
export interface PlaceOrderCommand {
  orderId: string;
  userId: number;
  instrumentId: number;
  side: TradeSide;
  type: OrderType;
  size?: number;
  amount?: Money;
  price?: Money;
}
