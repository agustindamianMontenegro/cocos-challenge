import { OrderSide, OrderStatus, OrderType, RejectionReason, TradeSide } from '@modules/trading/domain/types/order.types';

export const TRADE_SIDES: readonly TradeSide[] = ['BUY', 'SELL'];

export const ORDER_TYPES: readonly OrderType[] = ['MARKET', 'LIMIT'];

/** Incluye los lados de dinero de las órdenes históricas. */
export const ORDER_SIDES: readonly OrderSide[] = ['BUY', 'SELL', 'CASH_IN', 'CASH_OUT'];

export const ORDER_STATUSES: readonly OrderStatus[] = ['NEW', 'FILLED', 'REJECTED', 'CANCELLED'];

export const REJECTION_REASONS: readonly RejectionReason[] = ['INSUFFICIENT_FUNDS', 'INSUFFICIENT_SHARES'];
