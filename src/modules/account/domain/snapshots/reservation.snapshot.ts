/** Un compromiso de saldo o de acciones dentro de la foto de la cuenta. */
export type ReservationSnapshot =
  | { orderId: string; kind: 'FUNDS'; amount: string }
  | { orderId: string; kind: 'SHARES'; instrumentId: number; quantity: number };
