import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { UserNotFoundError } from '@modules/account/domain/errors/user-not-found.error';

export const existingUsers = (...ids: number[]): AccountQueriesPort => ({
  getSummary: async () => {
    throw new Error('no se usa');
  },
  assertUserExists: async (userId) => {
    if (!ids.includes(userId)) throw new UserNotFoundError(userId);
  },
});
