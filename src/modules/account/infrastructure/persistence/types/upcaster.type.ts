import { EventPayload } from './event-payload.type';

/** Convierte el payload de un hecho de una versión de esquema a la siguiente. */
export type Upcaster = (payload: EventPayload) => EventPayload;
