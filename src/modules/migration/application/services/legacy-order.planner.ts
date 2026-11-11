import { AccountCommand } from '@modules/account/application/ports/in/commands/account.command';
import { PlannedOrder } from '@modules/migration/application/types/planned-order.interface';
import { KNOWN_CORRECTIONS } from '@modules/migration/domain/constants/legacy-corrections';
import { MigrationError } from '@modules/migration/domain/errors/migration.error';
import { legacyOrderUuid } from '@modules/migration/domain/services/legacy-order-id';
import { LegacyOrder } from '@modules/migration/domain/types/legacy-order.interface';
import { StatusCorrection } from '@modules/migration/domain/types/status-correction.interface';

type CommandFactory = (order: LegacyOrder, orderId: string) => AccountCommand | null;

const amountOf = (order: LegacyOrder) => order.price.times(order.size);
const trade = (order: LegacyOrder, orderId: string) => ({
  orderId,
  instrumentId: order.instrumentId,
  quantity: order.size,
  price: order.price,
});

/** Qué le pide a la cuenta cada orden ejecutada, según su lado. */
const FILLED: Readonly<Record<string, CommandFactory>> = {
  CASH_IN: (order) => ({ type: 'DEPOSIT', amount: amountOf(order) }),
  CASH_OUT: (order) => ({ type: 'WITHDRAW', amount: amountOf(order) }),
  BUY: (order, orderId) => ({ type: 'BUY', ...trade(order, orderId) }),
  SELL: (order, orderId) => ({ type: 'SELL', ...trade(order, orderId) }),
};

/** Lo que compromete una LIMIT pendiente: saldo si compra, acciones si vende. */
const PENDING_LIMIT: Readonly<Record<string, CommandFactory>> = {
  BUY: (order, orderId) => ({ type: 'RESERVE_FUNDS', orderId, amount: amountOf(order) }),
  SELL: (order, orderId) => ({ type: 'RESERVE_SHARES', orderId, instrumentId: order.instrumentId, quantity: order.size }),
};

const NOTHING: CommandFactory = () => null;

/**
 * Decide cómo se importa una orden histórica. Las CANCELLED y REJECTED no mueven nada;
 * las correcciones conocidas se aplican; una combinación sin regla frena la migración.
 */
export function planLegacyOrder(legacy: LegacyOrder): PlannedOrder {
  const orderId = legacyOrderUuid(legacy.id);
  const correction = KNOWN_CORRECTIONS.get(legacy.id) ?? null;
  if (correction) {
    return corrected(legacy, orderId, correction);
  }
  const command = commandFactoryFor(legacy)(legacy, orderId);
  return { legacy, orderId, status: legacy.status, rejectionReason: null, correction: null, command };
}

function corrected(legacy: LegacyOrder, orderId: string, correction: StatusCorrection): PlannedOrder {
  if (legacy.status !== correction.originalValue) {
    throw new MigrationError(
      `La corrección de la orden ${legacy.id} esperaba ${correction.originalValue} y encontró ${legacy.status}.`,
    );
  }
  const { correctedValue: status, rejectionReason } = correction;
  return { legacy, orderId, status, rejectionReason, correction, command: null };
}

function commandFactoryFor(legacy: LegacyOrder): CommandFactory {
  const byStatus: Readonly<Record<string, CommandFactory | undefined>> = {
    FILLED: FILLED[legacy.side],
    NEW: legacy.type === 'LIMIT' ? PENDING_LIMIT[legacy.side] : undefined,
    CANCELLED: NOTHING,
    REJECTED: NOTHING,
  };
  const factory = byStatus[legacy.status];
  if (!factory) {
    throw new MigrationError(
      `La orden ${legacy.id} (${legacy.type} ${legacy.side} ${legacy.status}) no tiene una regla de importación.`,
    );
  }
  return factory;
}
