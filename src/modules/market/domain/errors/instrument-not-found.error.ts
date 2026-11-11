import { NotFoundError } from '@shared/domain/errors/not-found.error';

export class InstrumentNotFoundError extends NotFoundError {
  readonly code = 'INSTRUMENT_NOT_FOUND';

  constructor(instrumentId: number) {
    super(`No existe el instrumento ${instrumentId}.`);
  }
}
