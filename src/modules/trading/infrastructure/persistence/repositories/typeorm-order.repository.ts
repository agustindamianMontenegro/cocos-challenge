import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { DuplicateOrderIdError } from '@modules/trading/application/errors/duplicate-order-id.error';
import { OrderRepository } from '@modules/trading/application/ports/out/interfaces/order.repository.port';
import { ORDER_SIDES, ORDER_STATUSES, ORDER_TYPES, REJECTION_REASONS } from '@modules/trading/domain/constants/order.constants';
import { Order } from '@modules/trading/domain/entities/order';
import { OrderId } from '@modules/trading/domain/value-objects/order-id';
import { CorruptedOrderRecordError } from '@modules/trading/infrastructure/persistence/errors/corrupted-order-record.error';
import { OrderRow } from '@modules/trading/infrastructure/persistence/rows/order.row';
import { OrderSchema } from '@modules/trading/infrastructure/persistence/schemas/order.schema';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';
import { InstrumentId } from '@shared/domain/value-objects/instrument-id';
import { Money } from '@shared/domain/value-objects/money';
import { Quantity } from '@shared/domain/value-objects/quantity';
import { UserId } from '@shared/domain/value-objects/user-id';
import { asEntityManager } from '@shared/infrastructure/persistence/typeorm-transaction';

/** Código de PostgreSQL para una clave duplicada. */
const UNIQUE_VIOLATION = '23505';

/** Adaptador del puerto OrderRepository sobre la tabla orders. */
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findById(id: OrderId, tx?: Transaction): Promise<Order | null> {
    const manager = tx ? asEntityManager(tx) : this.dataSource.manager;
    const row = await manager.findOneBy(OrderSchema, { id: id.value });
    return row ? toOrder(row) : null;
  }

  async save(tx: Transaction, order: Order): Promise<void> {
    const manager = asEntityManager(tx);
    if (order.isNew) {
      await this.insert(manager, order);
    } else {
      await this.update(manager, order);
    }
  }

  /** Siempre INSERT: nunca se pisa una orden ajena que tenga el mismo id. */
  private async insert(manager: EntityManager, order: Order): Promise<void> {
    try {
      await manager.insert(OrderSchema, toRow(order));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateOrderIdError(order.id.value);
      }
      throw error;
    }
  }

  private async update(manager: EntityManager, order: Order): Promise<void> {
    const { status, rejectionReason, updatedAt } = order.toProps();
    await manager.update(OrderSchema, { id: order.id.value }, { status, rejectionReason, updatedAt });
  }
}

function toRow(order: Order): Omit<OrderRow, 'legacyOrderId'> {
  const props = order.toProps();
  return {
    ...props,
    id: props.id.value,
    userId: props.userId.value,
    instrumentId: props.instrumentId.value,
    size: props.size.value,
    price: props.price.toString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const { code } = error.driverError as { code?: unknown };
  return code === UNIQUE_VIOLATION;
}

function toOrder(row: OrderRow): Order {
  return Order.restore({
    id: OrderId.of(row.id),
    userId: UserId.of(row.userId),
    instrumentId: InstrumentId.of(row.instrumentId),
    side: oneOf(ORDER_SIDES, row.side, 'side'),
    type: oneOf(ORDER_TYPES, row.type, 'type'),
    size: Quantity.of(row.size),
    price: Money.of(row.price),
    status: oneOf(ORDER_STATUSES, row.status, 'status'),
    rejectionReason: row.rejectionReason === null ? null : oneOf(REJECTION_REASONS, row.rejectionReason, 'rejectionReason'),
    requestHash: row.requestHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

/** Un valor de la base que no está entre los permitidos es un dato corrupto: error técnico. */
function oneOf<T extends string>(allowed: readonly T[], value: string, field: string): T {
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new CorruptedOrderRecordError(field, value);
  }
  return match;
}
