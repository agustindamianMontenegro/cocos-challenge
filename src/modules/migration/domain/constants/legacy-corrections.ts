import { StatusCorrection } from '@modules/migration/domain/types/status-correction.interface';

/**
 * Correcciones decididas y documentadas (Spike §4.1, ADR-001 §4). Solo estas:
 * cualquier otra inconsistencia frena la migración en lugar de corregirse sola.
 */
export const KNOWN_CORRECTIONS: ReadonlyMap<number, StatusCorrection> = new Map([
  [
    11,
    {
      field: 'status',
      originalValue: 'FILLED',
      correctedValue: 'REJECTED',
      rejectionReason: 'INSUFFICIENT_SHARES',
      reason:
        'Vende 30 acciones del instrumento 31 teniendo 20: dejaría una tenencia negativa (−10). ' +
        'Según la regla del challenge debió rechazarse. Se corrige el estado, no el tipo de orden.',
    },
  ],
]);
