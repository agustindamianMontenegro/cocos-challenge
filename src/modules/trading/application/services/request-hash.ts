import { createHash } from 'node:crypto';
import { OrderRequest } from '@modules/trading/domain/types/order-request.interface';

/**
 * Huella del pedido para detectar reintentos: mismo orderId con los mismos datos.
 * Los importes se normalizan ("10000" y "10000.00" son el mismo pedido).
 */
export function requestHash(request: OrderRequest): string {
  const canonical = JSON.stringify([
    request.userId,
    request.instrumentId,
    request.side,
    request.type,
    request.size ?? null,
    request.amount?.toString() ?? null,
    request.price?.toString() ?? null,
  ]);
  return createHash('sha256').update(canonical).digest('hex');
}
