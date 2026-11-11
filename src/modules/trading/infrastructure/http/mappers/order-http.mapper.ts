import { PlaceOrderCommand } from '@modules/trading/application/ports/in/commands/place-order.command';
import { OrderView } from '@modules/trading/application/ports/in/views/order.view';
import { OrderResponseDto } from '@modules/trading/infrastructure/http/dto/order.response.dto';
import { PlaceOrderRequestDto } from '@modules/trading/infrastructure/http/dto/place-order.request.dto';
import { Money } from '@shared/domain/value-objects/money';

const money = (value: string | undefined): Money | undefined => (value === undefined ? undefined : Money.of(value));

export function toPlaceOrderCommand(dto: PlaceOrderRequestDto): PlaceOrderCommand {
  return {
    orderId: dto.orderId,
    userId: dto.userId,
    instrumentId: dto.instrumentId,
    side: dto.side,
    type: dto.type,
    size: dto.size,
    amount: money(dto.amount),
    price: money(dto.price),
  };
}

export function toOrderResponse(view: OrderView): OrderResponseDto {
  return {
    ...view,
    price: view.price.toFixed(),
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
  };
}
