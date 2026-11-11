import { AccountReconciliation } from './account-reconciliation.view';

/** Resultado de la migración y reporte de conciliación. */
export interface MigrationReport {
  /** true si ya estaba migrado y no se hizo nada. */
  alreadyMigrated: boolean;
  importedOrders: number;
  corrections: number;
  accounts: AccountReconciliation[];
}
