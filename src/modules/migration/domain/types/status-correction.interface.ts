import { CorrectedRejectionReason } from './corrected-rejection-reason.type';

/** Corrección de estado decidida y documentada para una orden histórica. */
export interface StatusCorrection {
  field: 'status';
  originalValue: string;
  correctedValue: 'REJECTED';
  rejectionReason: CorrectedRejectionReason;
  reason: string;
}
