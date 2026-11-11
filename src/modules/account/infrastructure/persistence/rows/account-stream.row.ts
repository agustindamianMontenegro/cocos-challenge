/** Fila de account_streams: una por usuario, se bloquea al operar. */
export interface AccountStreamRow {
  userId: number;
  version: number;
}
