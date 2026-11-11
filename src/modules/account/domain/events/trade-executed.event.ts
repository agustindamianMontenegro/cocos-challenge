/** Se ejecutó una compra o una venta. */
export interface TradeExecuted {
  type: 'TradeExecuted';
  orderId: string;
  instrumentId: number;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: string;
}
