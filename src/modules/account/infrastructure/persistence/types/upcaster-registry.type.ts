import { Upcaster } from './upcaster.type';

/** Upcasters por clave `${tipo}@${versión de origen}` (por ejemplo, "TradeExecuted@1"). */
export type UpcasterRegistry = ReadonlyMap<string, Upcaster>;
