import { UpcasterRegistry } from '@modules/account/infrastructure/persistence/types/upcaster-registry.type';

/**
 * Hoy todos los hechos están en su versión 1, así que no hay conversiones.
 * Ejemplo para cuando TradeExecuted pase a la versión 2 con un campo nuevo `fee`:
 *   ['TradeExecuted@1', (payload) => ({ ...payload, fee: '0' })]
 */
export const ACCOUNT_EVENT_UPCASTERS: UpcasterRegistry = new Map();
