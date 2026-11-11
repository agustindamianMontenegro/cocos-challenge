import { PositiveIntegerId } from './positive-integer-id';

/** Identificador de un instrumento. */
export class InstrumentId extends PositiveIntegerId {
  static of(value: number): InstrumentId {
    return new InstrumentId(PositiveIntegerId.validate(value, 'instrumentId'));
  }
}
