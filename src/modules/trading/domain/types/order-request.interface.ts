import { Money } from '@shared/domain/value-objects/money';
import { OrderType } from './order-type.type';
import { TradeSide } from './trade-side.type';

/** Lo que pide el usuario. La cantidad puede venir directa (size) o como monto en pesos (amount). */
export interface OrderRequest {
  orderId: string;
  userId: number;
  instrumentId: number;
  side: TradeSide;
  type: OrderType;
  size?: number;
  amount?: Money;
  price?: Money;
}
