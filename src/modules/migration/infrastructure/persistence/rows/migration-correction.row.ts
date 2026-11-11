/** Fila de migration_corrections: una corrección aplicada al migrar, con su motivo. */
export interface MigrationCorrectionRow {
  id: number;
  legacyOrderId: number;
  field: string;
  originalValue: string;
  correctedValue: string;
  reason: string;
  appliedAt: Date;
}
