/** Se liberó lo comprometido por una orden (por ejemplo, al cancelarla). */
export interface ReservationReleased {
  type: 'ReservationReleased';
  orderId: string;
}
