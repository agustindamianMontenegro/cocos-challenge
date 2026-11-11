import { EntityManager } from 'typeorm';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/** La transacción opaca de la aplicación es, por dentro, el EntityManager de una transacción de TypeORM. */
export function asEntityManager(tx: Transaction): EntityManager {
  return tx as unknown as EntityManager;
}

export function asTransaction(manager: EntityManager): Transaction {
  return manager as unknown as Transaction;
}
