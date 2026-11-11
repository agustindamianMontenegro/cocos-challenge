import { InvalidValueError } from '@shared/domain/errors/invalid-value.error';

/** Cantidad de acciones: siempre un entero mayor a cero. Es el único lugar donde vive esa regla. */
export class Quantity {
  private constructor(readonly value: number) {}

  static of(value: number): Quantity {
    if (!Quantity.isValid(value)) {
      throw new InvalidValueError('La cantidad tiene que ser un entero mayor a cero.');
    }
    return new Quantity(value);
  }

  static isValid(value: number): boolean {
    return Number.isInteger(value) && value > 0;
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }
}
