import { AccountCommand } from '@modules/account/application/ports/in/commands/account.command';
import { AccountCommandResult } from '@modules/account/application/ports/in/results/account-command.result';
import { Order } from '@modules/trading/domain/entities/order';
import { ExecutionOutcome } from '@modules/trading/domain/types/execution-outcome.type';
import { OrderType } from '@modules/trading/domain/types/order-type.type';
import { TradeSide } from '@modules/trading/domain/types/trade-side.type';

type CommandFactory = (order: Order) => AccountCommand;

/**
 * Qué le pide cada orden a la cuenta:
 * MARKET ejecuta la compra o venta; LIMIT compromete saldo (compra) o acciones (venta).
 */
const COMMANDS: Readonly<Record<`${OrderType}:${TradeSide}`, CommandFactory>> = {
  'MARKET:BUY': (o) => ({ type: 'BUY', ...tradeOf(o) }),
  'MARKET:SELL': (o) => ({ type: 'SELL', ...tradeOf(o) }),
  'LIMIT:BUY': (o) => ({ type: 'RESERVE_FUNDS', orderId: o.id.value, amount: o.amount() }),
  'LIMIT:SELL': (o) => {
    const { orderId, instrumentId, quantity } = tradeOf(o);
    return { type: 'RESERVE_SHARES', orderId, instrumentId, quantity };
  },
};

/** El puerto de Account transporta primitivos: acá se desarman los objetos de valor. */
function tradeOf(order: Order) {
  return {
    orderId: order.id.value,
    instrumentId: order.instrumentId.value,
    quantity: order.size.value,
    price: order.price,
  };
}

export function accountCommandFor(order: Order): AccountCommand {
  const factory = COMMANDS[`${order.type}:${order.side}` as keyof typeof COMMANDS];
  if (!factory) {
    throw new Error(`La orden ${order.id.value} (${order.type} ${order.side}) no se puede ejecutar sobre la cuenta.`);
  }
  return factory(order);
}

export function toExecutionOutcome(result: AccountCommandResult): ExecutionOutcome {
  return result.applied ? { accepted: true } : { accepted: false, reason: result.reason };
}
