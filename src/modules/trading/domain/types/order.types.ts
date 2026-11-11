/**
 * Tipos chicos de una orden, juntos en un archivo: son uniones de una línea que se leen mejor
 * todas a la vista. Las interfaces siguen yendo cada una en su propio archivo.
 */

/** BUY y SELL son órdenes; CASH_IN y CASH_OUT solo existen en las órdenes históricas importadas. */
export type OrderSide = 'BUY' | 'SELL' | 'CASH_IN' | 'CASH_OUT';

/** Lados que puede tener una orden nueva. */
export type TradeSide = 'BUY' | 'SELL';

/** MARKET se ejecuta al último cierre; LIMIT queda pendiente a su precio. */
export type OrderType = 'MARKET' | 'LIMIT';

/** Estados de una orden. Solo NEW puede cambiar. */
export type OrderStatus = 'NEW' | 'FILLED' | 'REJECTED' | 'CANCELLED';

/** Por qué se rechazó una orden. */
export type RejectionReason = 'INSUFFICIENT_FUNDS' | 'INSUFFICIENT_SHARES';

/** Resultado de aplicar la orden sobre la cuenta: aceptada, o rechazada por falta de recursos. */
export type ExecutionOutcome = { accepted: true } | { accepted: false; reason: RejectionReason };
