import { EventPayload } from './event-payload.type';

/** Un hecho tal como se guarda en account_events: tipo y versión en columnas, el resto en payload. */
export interface StoredAccountEvent {
  type: string;
  schemaVersion: number;
  payload: EventPayload;
}
