import { OrderSide } from '@modules/trading/domain/types/order-side.type';
import { OrderStatus } from '@modules/trading/domain/types/order-status.type';
import { OrderType } from '@modules/trading/domain/types/order-type.type';
import { RejectionReason } from '@modules/trading/domain/types/rejection-reason.type';
import { TradeSide } from '@modules/trading/domain/types/trade-side.type';

export const TRADE_SIDES: readonly TradeSide[] = ['BUY', 'SELL'];

export const ORDER_TYPES: readonly OrderType[] = ['MARKET', 'LIMIT'];

/** Incluye los lados de dinero de las órdenes históricas. */
export const ORDER_SIDES: readonly OrderSide[] = ['BUY', 'SELL', 'CASH_IN', 'CASH_OUT'];

export const ORDER_STATUSES: readonly OrderStatus[] = ['NEW', 'FILLED', 'REJECTED', 'CANCELLED'];

export const REJECTION_REASONS: readonly RejectionReason[] = ['INSUFFICIENT_FUNDS', 'INSUFFICIENT_SHARES'];
