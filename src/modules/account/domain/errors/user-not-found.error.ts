import { NotFoundError } from '@shared/domain/errors/not-found.error';

export class UserNotFoundError extends NotFoundError {
  readonly code = 'USER_NOT_FOUND';

  constructor(userId: number) {
    super(`No existe el usuario ${userId}.`);
  }
}
