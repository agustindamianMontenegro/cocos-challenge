import { OrderView } from '@modules/trading/application/ports/in/views/order.view';
import { Order } from '@modules/trading/domain/entities/order';

/** La huella del pedido es un detalle interno: no forma parte de la vista. */
export function toOrderView(order: Order): OrderView {
  const props = order.toProps();
  return {
    id: props.id.value,
    userId: props.userId.value,
    instrumentId: props.instrumentId.value,
    side: props.side,
    type: props.type,
    size: props.size.value,
    price: props.price,
    status: props.status,
    rejectionReason: props.rejectionReason,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}
