import { AccountEvent } from '@modules/account/domain/events/account.event';

/**
 * Versión vigente del esquema de cada hecho. Si un hecho cambia de forma, se sube su versión
 * acá y se agrega en ACCOUNT_EVENT_UPCASTERS cómo convertir los guardados con la anterior.
 */
export const EVENT_SCHEMA_VERSIONS: Readonly<Record<AccountEvent['type'], number>> = {
  CashDeposited: 1,
  CashWithdrawn: 1,
  TradeExecuted: 1,
  FundsReserved: 1,
  SharesReserved: 1,
  ReservationReleased: 1,
};

/** Versión vigente de la foto de la cuenta. Las fotos de otra versión se ignoran y se regeneran. */
export const SNAPSHOT_SCHEMA_VERSION = 1;
