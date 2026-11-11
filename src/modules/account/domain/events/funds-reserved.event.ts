/** Una LIMIT de compra comprometió saldo. */
export interface FundsReserved {
  type: 'FundsReserved';
  orderId: string;
  amount: string;
}
