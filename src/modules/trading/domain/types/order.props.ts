import { OrderId } from '@modules/trading/domain/value-objects/order-id';
import { InstrumentId } from '@shared/domain/value-objects/instrument-id';
import { Money } from '@shared/domain/value-objects/money';
import { Quantity } from '@shared/domain/value-objects/quantity';
import { UserId } from '@shared/domain/value-objects/user-id';
import { OrderSide, OrderStatus, OrderType, RejectionReason } from './order.types';

/** Estado completo de una orden. */
export interface OrderProps {
  id: OrderId;
  userId: UserId;
  instrumentId: InstrumentId;
  side: OrderSide;
  type: OrderType;
  size: Quantity;
  price: Money;
  status: OrderStatus;
  rejectionReason: RejectionReason | null;
  requestHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}
