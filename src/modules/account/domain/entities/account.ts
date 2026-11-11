import { InsufficientFundsError } from '@modules/account/domain/errors/insufficient-funds.error';
import { InsufficientSharesError } from '@modules/account/domain/errors/insufficient-shares.error';
import { InvalidAmountError } from '@modules/account/domain/errors/invalid-amount.error';
import { ReservationNotFoundError } from '@modules/account/domain/errors/reservation-not-found.error';
import { AccountEvent } from '@modules/account/domain/events/account.event';
import { AccountSnapshotState } from '@modules/account/domain/snapshots/account-snapshot-state';
import { ReservationSnapshot } from '@modules/account/domain/snapshots/reservation.snapshot';
import { TradeCommand } from '@modules/account/domain/types/trade.command';
import { Position } from '@modules/account/domain/value-objects/position';
import { Money } from '@shared/domain/value-objects/money';
import { Quantity } from '@shared/domain/value-objects/quantity';

type EventHandlers = {
  [K in AccountEvent['type']]: (event: Extract<AccountEvent, { type: K }>) => void;
};

/**
 * Cuenta de un usuario, reconstruida a partir de sus hechos.
 * Valida que alcancen los recursos y registra nuevos hechos; no ejecuta órdenes.
 */
export class Account {
  private cash = Money.ZERO;
  private readonly positionsById = new Map<number, Position>();
  private readonly reservations = new Map<string, ReservationSnapshot>();
  private pending: AccountEvent[] = [];

  private constructor(
    readonly userId: number,
    private currentVersion: number,
  ) {}

  static empty(userId: number): Account {
    return new Account(userId, 0);
  }

  static fromSnapshot(userId: number, version: number, state: AccountSnapshotState): Account {
    const account = new Account(userId, version);
    account.cash = Money.of(state.cash);
    state.positions.forEach((p) =>
      account.positionsById.set(p.instrumentId, new Position(p.quantity, Money.of(p.cost))),
    );
    state.reservations.forEach((r) => account.reservations.set(r.orderId, r));
    return account;
  }

  /** Aplica hechos ya guardados, en orden. */
  replay(events: readonly AccountEvent[]): this {
    events.forEach((event) => {
      this.apply(event);
      this.currentVersion += 1;
    });
    return this;
  }

  // ---------- Consultas ----------

  get version(): number {
    return this.currentVersion;
  }

  totalCash(): Money {
    return this.cash;
  }

  reservedCash(): Money {
    return [...this.reservations.values()].reduce(
      (sum, r) => (r.kind === 'FUNDS' ? sum.plus(Money.of(r.amount)) : sum),
      Money.ZERO,
    );
  }

  availableCash(): Money {
    return this.cash.minus(this.reservedCash());
  }

  sharesOf(instrumentId: number): number {
    return this.positionOf(instrumentId).quantity;
  }

  reservedShares(instrumentId: number): number {
    return [...this.reservations.values()].reduce(
      (sum, r) => (r.kind === 'SHARES' && r.instrumentId === instrumentId ? sum + r.quantity : sum),
      0,
    );
  }

  availableShares(instrumentId: number): number {
    return this.sharesOf(instrumentId) - this.reservedShares(instrumentId);
  }

  positions(): ReadonlyMap<number, Position> {
    return this.positionsById;
  }

  canSpend(amount: Money): boolean {
    return !amount.isGreaterThan(this.availableCash());
  }

  canDeliver(instrumentId: number, quantity: number): boolean {
    return quantity <= this.availableShares(instrumentId);
  }

  // ---------- Comandos ----------

  deposit(amount: Money): void {
    assertPositive(amount);
    this.record({ type: 'CashDeposited', amount: amount.toString() });
  }

  withdraw(amount: Money): void {
    assertPositive(amount);
    this.ensureCanSpend(amount);
    this.record({ type: 'CashWithdrawn', amount: amount.toString() });
  }

  buy(trade: TradeCommand): void {
    assertQuantity(trade.quantity);
    this.ensureCanSpend(trade.price.times(trade.quantity));
    this.record(tradeEvent('BUY', trade));
  }

  sell(trade: TradeCommand): void {
    assertQuantity(trade.quantity);
    this.ensureCanDeliver(trade.instrumentId, trade.quantity);
    this.record(tradeEvent('SELL', trade));
  }

  reserveFunds(orderId: string, amount: Money): void {
    assertPositive(amount);
    this.ensureCanSpend(amount);
    this.record({ type: 'FundsReserved', orderId, amount: amount.toString() });
  }

  reserveShares(orderId: string, instrumentId: number, quantity: number): void {
    assertQuantity(quantity);
    this.ensureCanDeliver(instrumentId, quantity);
    this.record({ type: 'SharesReserved', orderId, instrumentId, quantity });
  }

  release(orderId: string): void {
    if (!this.reservations.has(orderId)) {
      throw new ReservationNotFoundError(orderId);
    }
    this.record({ type: 'ReservationReleased', orderId });
  }

  /** Devuelve los hechos nuevos para guardarlos y vacía la lista. */
  pullPendingEvents(): AccountEvent[] {
    const events = this.pending;
    this.pending = [];
    return events;
  }

  toSnapshot(): AccountSnapshotState {
    return {
      cash: this.cash.toString(),
      positions: [...this.positionsById.entries()].map(([instrumentId, p]) => ({
        instrumentId,
        quantity: p.quantity,
        cost: p.cost.toString(),
      })),
      reservations: [...this.reservations.values()],
    };
  }

  // ---------- Internos ----------

  private ensureCanSpend(amount: Money): void {
    if (!this.canSpend(amount)) {
      throw new InsufficientFundsError();
    }
  }

  private ensureCanDeliver(instrumentId: number, quantity: number): void {
    if (!this.canDeliver(instrumentId, quantity)) {
      throw new InsufficientSharesError();
    }
  }

  private record(event: AccountEvent): void {
    this.apply(event);
    this.currentVersion += 1;
    this.pending.push(event);
  }

  private positionOf(instrumentId: number): Position {
    return this.positionsById.get(instrumentId) ?? Position.EMPTY;
  }

  private setPosition(instrumentId: number, position: Position): void {
    if (position.isEmpty()) {
      this.positionsById.delete(instrumentId);
      return;
    }
    this.positionsById.set(instrumentId, position);
  }

  private apply(event: AccountEvent): void {
    const handler = this.handlers[event.type] as (e: AccountEvent) => void;
    handler(event);
  }

  private readonly handlers: EventHandlers = {
    CashDeposited: (e) => {
      this.cash = this.cash.plus(Money.of(e.amount));
    },
    CashWithdrawn: (e) => {
      this.cash = this.cash.minus(Money.of(e.amount));
    },
    TradeExecuted: (e) => this.applyTrade(e),
    FundsReserved: (e) => {
      this.reservations.set(e.orderId, { orderId: e.orderId, kind: 'FUNDS', amount: e.amount });
    },
    SharesReserved: (e) => {
      this.reservations.set(e.orderId, { ...e, kind: 'SHARES' });
    },
    ReservationReleased: (e) => {
      this.reservations.delete(e.orderId);
    },
  };

  private applyTrade(e: Extract<AccountEvent, { type: 'TradeExecuted' }>): void {
    const amount = Money.of(e.price).times(e.quantity);
    const position = this.positionOf(e.instrumentId);
    if (e.side === 'BUY') {
      this.cash = this.cash.minus(amount);
      this.setPosition(e.instrumentId, position.buy(e.quantity, Money.of(e.price)));
      return;
    }
    this.cash = this.cash.plus(amount);
    this.setPosition(e.instrumentId, position.sell(e.quantity));
  }
}

function tradeEvent(side: 'BUY' | 'SELL', trade: TradeCommand): AccountEvent {
  return {
    type: 'TradeExecuted',
    orderId: trade.orderId,
    instrumentId: trade.instrumentId,
    side,
    quantity: trade.quantity,
    price: trade.price.toString(),
  };
}

function assertPositive(amount: Money): void {
  if (amount.isNegative() || amount.isZero()) {
    throw new InvalidAmountError('El importe tiene que ser mayor a cero.');
  }
}

/** La regla de la cantidad vive en el objeto de valor Quantity. */
function assertQuantity(quantity: number): void {
  Quantity.of(quantity);
}
