import { ListOrdersCommand } from '@modules/trading/application/ports/in/commands/list-orders.command';
import { OrderPageResult } from '@modules/trading/application/ports/in/results/order-page.result';

/**
 * Puerto de entrada: órdenes de un usuario, paginadas.
 * Lanza UserNotFoundError si el usuario no existe e InvalidPageError si la página no es válida.
 */
export interface ListOrdersUseCase {
  execute(command: ListOrdersCommand): Promise<OrderPageResult>;
}
