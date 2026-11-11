import { CashDeposited } from './cash-deposited.event';
import { CashWithdrawn } from './cash-withdrawn.event';
import { FundsReserved } from './funds-reserved.event';
import { ReservationReleased } from './reservation-released.event';
import { SharesReserved } from './shares-reserved.event';
import { TradeExecuted } from './trade-executed.event';

/**
 * Hechos de la cuenta. Son la fuente de verdad: saldo, compromisos, tenencias y precio promedio
 * se calculan aplicándolos en orden. Los importes viajan como string para no perder precisión al
 * guardarlos en JSON.
 */
export type AccountEvent =
  | CashDeposited
  | CashWithdrawn
  | TradeExecuted
  | FundsReserved
  | SharesReserved
  | ReservationReleased;
