import { InvalidValueError } from '@shared/domain/errors/invalid-value.error';

/** Base de los identificadores numéricos de la base original (users.id, instruments.id). */
export abstract class PositiveIntegerId {
  protected constructor(readonly value: number) {}

  protected static validate(value: number, label: string): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new InvalidValueError(`${label} tiene que ser un entero mayor a cero.`);
    }
    return value;
  }

  equals(other: PositiveIntegerId): boolean {
    return this.constructor === other.constructor && this.value === other.value;
  }
}
