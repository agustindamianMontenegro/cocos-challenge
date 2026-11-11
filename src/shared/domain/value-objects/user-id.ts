import { PositiveIntegerId } from './positive-integer-id';

/** Identificador de un usuario (y de su cuenta). */
export class UserId extends PositiveIntegerId {
  static of(value: number): UserId {
    return new UserId(PositiveIntegerId.validate(value, 'userId'));
  }
}
