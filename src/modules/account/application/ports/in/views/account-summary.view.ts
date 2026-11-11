import { AccountBalance } from './account-balance.view';
import { AccountPosition } from './account-position.view';

/** Estado de la cuenta de un usuario, para consultas. */
export interface AccountSummary {
  userId: number;
  accountNumber: string;
  balance: AccountBalance;
  positions: AccountPosition[];
}
