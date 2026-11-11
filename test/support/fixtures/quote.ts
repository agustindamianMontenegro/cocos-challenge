import { Quote } from '@modules/market/domain/value-objects/quote';
import { Money } from '@shared/domain/value-objects/money';

export const quote = (instrumentId: number, close: string, previousClose: string | null = null): Quote =>
  new Quote(instrumentId, Money.of(close), previousClose === null ? null : Money.of(previousClose), null);
