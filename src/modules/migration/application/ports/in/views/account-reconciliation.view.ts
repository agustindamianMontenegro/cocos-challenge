import { Balances } from '@modules/migration/domain/types/balances.interface';

/** Conciliación de una cuenta: el cálculo original frente a la cuenta migrada. */
export interface AccountReconciliation {
  userId: number;
  /** Lo que da sumar todas las órdenes FILLED tal cual vienen. */
  original: Balances;
  /** El estado de la cuenta migrada, con las correcciones. */
  corrected: Balances & { reserved: string; available: string };
}
