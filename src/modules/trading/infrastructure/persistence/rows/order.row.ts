/** Fila de orders. price es NUMERIC: el driver lo devuelve como texto, sin perder precisión. */
export interface OrderRow {
  id: string;
  legacyOrderId: number | null;
  userId: number;
  instrumentId: number;
  side: string;
  type: string;
  size: number;
  price: string;
  status: string;
  rejectionReason: string | null;
  requestHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}
