/** Fila de account_events. El id es BIGSERIAL: el driver lo devuelve como texto. */
export interface AccountEventRow {
  id: string;
  userId: number;
  version: number;
  type: string;
  schemaVersion: number;
  payload: unknown;
  orderId: string | null;
  occurredAt: Date;
}
