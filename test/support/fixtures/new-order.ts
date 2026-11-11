import { NewOrder } from '@modules/trading/domain/types/new-order.props';
import { OrderSide } from '@modules/trading/domain/types/order-side.type';
import { OrderType } from '@modules/trading/domain/types/order-type.type';
import { OrderId } from '@modules/trading/domain/value-objects/order-id';
import { InstrumentId } from '@shared/domain/value-objects/instrument-id';
import { Money } from '@shared/domain/value-objects/money';
import { Quantity } from '@shared/domain/value-objects/quantity';
import { UserId } from '@shared/domain/value-objects/user-id';
import { ORDER_IDS } from './order-ids';

export interface NewOrderInput {
  id?: string;
  userId?: number;
  instrumentId?: number;
  side?: OrderSide;
  type?: OrderType;
  size?: number;
  price?: number | string;
  requestHash?: string | null;
}

/** Datos de una orden nueva con primitivos, para escribir pruebas cortas. */
const DEFAULTS: Required<NewOrderInput> = {
  id: ORDER_IDS.first,
  userId: 1,
  instrumentId: 47,
  side: 'BUY',
  type: 'LIMIT',
  size: 10,
  price: 240,
  requestHash: null,
};

/** Datos de una orden nueva con primitivos, para escribir pruebas cortas. */
export function newOrder(input: NewOrderInput = {}): NewOrder {
  const values = { ...DEFAULTS, ...input };
  return {
    id: OrderId.of(values.id),
    userId: UserId.of(values.userId),
    instrumentId: InstrumentId.of(values.instrumentId),
    side: values.side,
    type: values.type,
    size: Quantity.of(values.size),
    price: Money.of(values.price),
    requestHash: values.requestHash,
  };
}
