import { UnitOfWork } from '@shared/application/ports/out/interfaces/unit-of-work.port';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';
import { FAKE_TX } from './fake-transaction';

/** Ejecuta el trabajo sin base de datos (sin rollback: alcanza para los casos de uso). */
export const inlineUnitOfWork: UnitOfWork = {
  run: <T>(work: (tx: Transaction) => Promise<T>) => work(FAKE_TX),
};
