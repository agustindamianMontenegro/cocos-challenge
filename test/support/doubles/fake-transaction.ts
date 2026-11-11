import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/** Una transacción falsa: los casos de uso solo la pasan de largo. */
export const FAKE_TX = {} as Transaction;
