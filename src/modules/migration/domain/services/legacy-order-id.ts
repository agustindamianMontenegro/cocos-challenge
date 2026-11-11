import { createHash } from 'node:crypto';

/** Espacio de nombres fijo para derivar los UUID de las órdenes migradas. */
const LEGACY_NAMESPACE = 'c0c05c0c-0000-5000-8000-000000000000';

/**
 * UUID fijo (versión 5, RFC 9562) para cada orden histórica: siempre el mismo
 * para el mismo id, así la migración se puede repetir.
 */
export function legacyOrderUuid(legacyId: number): string {
  const namespace = Buffer.from(LEGACY_NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(namespace).update(`orders_legacy:${legacyId}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
