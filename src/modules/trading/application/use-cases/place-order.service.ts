import { DuplicateOrderIdError } from '@modules/trading/application/errors/duplicate-order-id.error';
import { accountCommandFor, toExecutionOutcome } from '@modules/trading/application/mappers/account-command.mapper';
import { toOrderView } from '@modules/trading/application/mappers/order-view.mapper';
import { PlaceOrderCommand } from '@modules/trading/application/ports/in/commands/place-order.command';
import { PlaceOrderUseCase } from '@modules/trading/application/ports/in/interfaces/place-order.use-case';
import { PlaceOrderResult } from '@modules/trading/application/ports/in/results/place-order.result';
import { requestHash } from '@modules/trading/application/services/request-hash';
import { PlaceOrderDependencies } from '@modules/trading/application/types/place-order.dependencies';
import { Pricing } from '@modules/trading/application/types/pricing.interface';
import { Order } from '@modules/trading/domain/entities/order';
import { InvalidOrderError } from '@modules/trading/domain/errors/invalid-order.error';
import { OrderIdConflictError } from '@modules/trading/domain/errors/order-id-conflict.error';
import { PriceUnavailableError } from '@modules/trading/domain/errors/price-unavailable.error';
import { limitPriceOf, resolveSize, validateOrderRequest } from '@modules/trading/domain/services/order-request.rules';
import { OrderId } from '@modules/trading/domain/value-objects/order-id';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';
import { InstrumentId } from '@shared/domain/value-objects/instrument-id';
import { Money } from '@shared/domain/value-objects/money';
import { UserId } from '@shared/domain/value-objects/user-id';

/** Envía una orden MARKET o LIMIT. La orden y sus efectos en la cuenta se guardan juntos. */
export class PlaceOrderService implements PlaceOrderUseCase {
  constructor(private readonly deps: PlaceOrderDependencies) {}

  async execute(command: PlaceOrderCommand): Promise<PlaceOrderResult> {
    validateOrderRequest(command);
    const hash = requestHash(command);
    const existing = await this.findRetry(command.orderId, hash);
    if (existing) {
      return { order: toOrderView(existing), created: false };
    }
    await this.deps.accountQueries.assertUserExists(command.userId);
    const price = await this.executionPrice(command);
    const pricing = { price, size: resolveSize(command, price), hash };
    try {
      return await this.deps.unitOfWork.run((tx) => this.placeLocked(tx, command, pricing));
    } catch (error) {
      return this.recoverFromDuplicate(error, command.orderId, hash);
    }
  }

  private async placeLocked(tx: Transaction, command: PlaceOrderCommand, pricing: Pricing): Promise<PlaceOrderResult> {
    await this.deps.accountCommands.lock(tx, command.userId);
    const existing = await this.findRetry(command.orderId, pricing.hash, tx);
    if (existing) {
      return { order: toOrderView(existing), created: false };
    }
    const now = new Date();
    const order = this.newOrder(command, pricing, now);
    const result = await this.deps.accountCommands.execute(tx, command.userId, accountCommandFor(order), {
      orderId: order.id.value,
      occurredAt: now,
    });
    order.applyOutcome(toExecutionOutcome(result), now);
    await this.deps.orders.save(tx, order);
    return { order: toOrderView(order), created: true };
  }

  private newOrder(command: PlaceOrderCommand, pricing: Pricing, now: Date): Order {
    const { orderId, userId, instrumentId, side, type } = command;
    const { price, size, hash } = pricing;
    return Order.create(
      {
        id: OrderId.of(orderId),
        userId: UserId.of(userId),
        instrumentId: InstrumentId.of(instrumentId),
        side,
        type,
        size,
        price,
        requestHash: hash,
      },
      now,
    );
  }

  /** Mismo orderId: con los mismos datos es un reintento; con otros, un conflicto. */
  private async findRetry(orderId: string, hash: string, tx?: Transaction): Promise<Order | null> {
    const existing = await this.deps.orders.findById(OrderId.of(orderId), tx);
    if (existing && existing.requestHash !== hash) {
      throw new OrderIdConflictError(orderId);
    }
    return existing;
  }

  /** Otra transacción guardó el mismo orderId justo antes (por ejemplo, de otra cuenta). */
  private async recoverFromDuplicate(error: unknown, orderId: string, hash: string): Promise<PlaceOrderResult> {
    if (!(error instanceof DuplicateOrderIdError)) {
      throw error;
    }
    const existing = await this.findRetry(orderId, hash);
    if (!existing) {
      throw error;
    }
    return { order: toOrderView(existing), created: false };
  }

  /** MARKET: último precio de cierre. LIMIT: el precio que indica el usuario. */
  private async executionPrice(command: PlaceOrderCommand): Promise<Money> {
    const instrument = await this.deps.market.getInstrumentPrice(command.instrumentId);
    if (!instrument.tradable) {
      throw new InvalidOrderError('Los pesos no se operan como instrumento: se muestran como saldo.');
    }
    if (command.type === 'LIMIT') {
      return limitPriceOf(command);
    }
    if (!instrument.lastPrice) {
      throw new PriceUnavailableError(instrument.id);
    }
    return instrument.lastPrice;
  }
}
