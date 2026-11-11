import { InvalidValueError } from '@shared/domain/errors/invalid-value.error';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Identificador de una orden: un UUID. Las nuevas usan UUIDv7 (lo exige la API);
 * las migradas, UUIDv5. Por eso acá no se restringe la versión.
 */
export class OrderId {
  private constructor(readonly value: string) {}

  static of(value: string): OrderId {
    if (!UUID.test(value)) {
      throw new InvalidValueError('El id de la orden tiene que ser un UUID.');
    }
    return new OrderId(value.toLowerCase());
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
