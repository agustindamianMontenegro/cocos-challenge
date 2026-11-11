import { AccountEvent } from '@modules/account/domain/events/account.event';
import { ACCOUNT_EVENT_UPCASTERS } from '@modules/account/infrastructure/persistence/constants/account-event.upcasters';
import { EVENT_SCHEMA_VERSIONS } from '@modules/account/infrastructure/persistence/constants/schema-versions.constants';
import { CorruptedAccountStreamError } from '@modules/account/infrastructure/persistence/errors/corrupted-account-stream.error';
import { EventPayload } from '@modules/account/infrastructure/persistence/types/event-payload.type';
import { EventSchemaOptions } from '@modules/account/infrastructure/persistence/types/event-schema.options';
import { StoredAccountEvent } from '@modules/account/infrastructure/persistence/types/stored-account-event.interface';
import { UpcasterRegistry } from '@modules/account/infrastructure/persistence/types/upcaster-registry.type';

const DEFAULT_SCHEMA: EventSchemaOptions = {
  currentVersions: EVENT_SCHEMA_VERSIONS,
  upcasters: ACCOUNT_EVENT_UPCASTERS,
};

/** Se guarda siempre con la versión vigente del esquema de su tipo. */
export function toStoredEvent(event: AccountEvent): StoredAccountEvent {
  const { type, ...payload } = event;
  return { type, schemaVersion: EVENT_SCHEMA_VERSIONS[type], payload };
}

/**
 * Lee un hecho guardado y, si quedó en una versión vieja, lo lleva a la vigente
 * aplicando los upcasters en cadena (v1 → v2 → …).
 */
export function fromStoredEvent(
  stored: { type: string; schemaVersion: number; payload: unknown },
  schema: EventSchemaOptions = DEFAULT_SCHEMA,
): AccountEvent {
  const current = currentVersionOf(stored.type, schema);
  if (!isObject(stored.payload)) {
    throw new CorruptedAccountStreamError(`el hecho ${stored.type} no tiene payload.`);
  }
  if (stored.schemaVersion > current) {
    throw new CorruptedAccountStreamError(
      `el hecho ${stored.type} está en la versión ${stored.schemaVersion} y este código conoce hasta la ${current}.`,
    );
  }
  const payload = upcast({ ...stored, payload: stored.payload }, current, schema.upcasters);
  return { ...payload, type: stored.type } as AccountEvent;
}

function currentVersionOf(type: string, schema: EventSchemaOptions): number {
  const current = schema.currentVersions[type];
  if (current === undefined) {
    throw new CorruptedAccountStreamError(`tipo de hecho desconocido "${type}".`);
  }
  return current;
}

function upcast(stored: StoredAccountEvent, toVersion: number, upcasters: UpcasterRegistry): EventPayload {
  const { type } = stored;
  let result = stored.payload;
  for (let version = stored.schemaVersion; version < toVersion; version++) {
    const upcaster = upcasters.get(`${type}@${version}`);
    if (!upcaster) {
      throw new CorruptedAccountStreamError(`falta el upcaster de ${type} para la versión ${version}.`);
    }
    result = upcaster(result);
  }
  return result;
}

function isObject(value: unknown): value is EventPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
