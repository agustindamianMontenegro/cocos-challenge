/** Una LIMIT de venta comprometió acciones. */
export interface SharesReserved {
  type: 'SharesReserved';
  orderId: string;
  instrumentId: number;
  quantity: number;
}
