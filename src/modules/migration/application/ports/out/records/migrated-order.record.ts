import { LegacyOrder } from '@modules/migration/domain/types/legacy-order.interface';
import { StatusCorrection } from '@modules/migration/domain/types/status-correction.interface';

/** Cómo queda importada una orden histórica. */
export interface MigratedOrder {
  legacy: LegacyOrder;
  orderId: string;
  status: string;
  rejectionReason: string | null;
  correction: StatusCorrection | null;
}
