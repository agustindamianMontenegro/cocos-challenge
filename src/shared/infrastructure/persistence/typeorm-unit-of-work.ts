import { DataSource } from 'typeorm';
import { UnitOfWork } from '@shared/application/ports/out/interfaces/unit-of-work.port';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';
import { asTransaction } from '@shared/infrastructure/persistence/typeorm-transaction';

/** Cuánto se espera un bloqueo y cuánto puede tardar una consulta dentro de la transacción. */
const TRANSACTION_LIMITS = ["SET LOCAL lock_timeout = '5s'", "SET LOCAL statement_timeout = '10s'"];

/** Adaptador del puerto UnitOfWork con una transacción de TypeORM. */
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Si el trabajo falla, se deshace todo y el error sigue de largo:
   * un error técnico nunca se convierte en un rechazo.
   */
  run<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      for (const limit of TRANSACTION_LIMITS) {
        await manager.query(limit);
      }
      return work(asTransaction(manager));
    });
  }
}
