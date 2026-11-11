/** Fila de account_snapshots: la foto del estado de una cuenta en una versión. */
export interface AccountSnapshotRow {
  userId: number;
  version: number;
  schemaVersion: number;
  state: unknown;
  createdAt: Date;
}
