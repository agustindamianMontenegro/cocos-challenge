import { Instrument } from '@modules/market/domain/types/instrument.interface';

/** Tipo de los pesos en `instruments`. Se muestran como saldo, no como instrumento operable. */
export const CURRENCY_TYPE = 'MONEDA';

export function isCurrency(instrument: Instrument): boolean {
  return instrument.type === CURRENCY_TYPE;
}
