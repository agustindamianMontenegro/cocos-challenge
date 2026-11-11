import { ConflictError } from '@shared/domain/errors/conflict.error';

export class PriceUnavailableError extends ConflictError {
  readonly code = 'PRICE_UNAVAILABLE';

  constructor(instrumentId: number) {
    super(`El instrumento ${instrumentId} no tiene cotización: no se puede ejecutar una orden MARKET.`);
  }
}
