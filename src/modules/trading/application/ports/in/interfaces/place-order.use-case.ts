import { PlaceOrderCommand } from '@modules/trading/application/ports/in/commands/place-order.command';
import { PlaceOrderResult } from '@modules/trading/application/ports/in/results/place-order.result';

/** Puerto de entrada: enviar una orden MARKET o LIMIT. */
export interface PlaceOrderUseCase {
  execute(command: PlaceOrderCommand): Promise<PlaceOrderResult>;
}

