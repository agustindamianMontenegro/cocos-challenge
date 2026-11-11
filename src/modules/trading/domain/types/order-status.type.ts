/** Estados de una orden. Solo NEW puede cambiar. */
export type OrderStatus = 'NEW' | 'FILLED' | 'REJECTED' | 'CANCELLED';
