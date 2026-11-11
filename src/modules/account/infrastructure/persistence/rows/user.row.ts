/** Fila de users. En database.sql las columnas aceptan NULL. */
export interface UserRow {
  id: number;
  email: string | null;
  accountNumber: string | null;
}
