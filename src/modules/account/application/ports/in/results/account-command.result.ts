import { AccountShortage } from '@modules/account/application/ports/in/types/account-shortage.type';

/** Resultado de un comando: aplicado, o no aplicado por falta de recursos. */
export type AccountCommandResult = { applied: true } | { applied: false; reason: AccountShortage };
