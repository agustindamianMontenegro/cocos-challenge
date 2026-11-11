/** Datos que acompañan al hecho que genera un comando. */
export interface AccountCommandContext {
  /** Orden que origina el cambio, si la hay. */
  orderId?: string;
  /** Momento del hecho. Por defecto, ahora; la migración usa la fecha original. */
  occurredAt?: Date;
}
