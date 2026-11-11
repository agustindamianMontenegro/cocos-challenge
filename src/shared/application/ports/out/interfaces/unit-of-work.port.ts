import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/** Puerto de salida: ejecuta un trabajo dentro de una única transacción (se guarda todo o nada). */
export interface UnitOfWork {
  run<T>(work: (tx: Transaction) => Promise<T>): Promise<T>;
}

