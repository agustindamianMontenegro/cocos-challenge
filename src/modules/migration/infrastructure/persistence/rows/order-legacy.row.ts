/** Fila de orders_legacy (la orders original de database.sql, intacta). Todas las columnas aceptan NULL. */
export interface OrderLegacyRow {
  id: number;
  instrumentId: number | null;
  userId: number | null;
  size: number | null;
  price: string | null;
  type: string | null;
  side: string | null;
  status: string | null;
  datetime: Date | null;
}
