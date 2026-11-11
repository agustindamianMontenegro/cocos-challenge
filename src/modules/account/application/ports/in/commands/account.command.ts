import { Money } from '@shared/domain/value-objects/money';

/**
 * Lo que se le puede pedir a una cuenta: mover dinero, ejecutar una operación, comprometer o
 * liberar.
 */
export type AccountCommand =
  | { type: 'DEPOSIT'; amount: Money }
  | { type: 'WITHDRAW'; amount: Money }
  | { type: 'BUY'; orderId: string; instrumentId: number; quantity: number; price: Money }
  | { type: 'SELL'; orderId: string; instrumentId: number; quantity: number; price: Money }
  | { type: 'RESERVE_FUNDS'; orderId: string; amount: Money }
  | { type: 'RESERVE_SHARES'; orderId: string; instrumentId: number; quantity: number }
  | { type: 'RELEASE'; orderId: string };
