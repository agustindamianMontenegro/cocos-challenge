import { PositionSnapshot } from './position.snapshot';
import { ReservationSnapshot } from './reservation.snapshot';

/** Foto serializable del estado de la cuenta en una versión dada. */
export interface AccountSnapshotState {
  cash: string;
  positions: PositionSnapshot[];
  reservations: ReservationSnapshot[];
}
