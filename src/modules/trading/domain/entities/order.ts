import { InvalidOrderTransitionError } from '@modules/trading/domain/errors/invalid-order-transition.error';
import { OrderNotCancellableError } from '@modules/trading/domain/errors/order-not-cancellable.error';
import { ExecutionOutcome } from '@modules/trading/domain/types/execution-outcome.type';
import { NewOrder } from '@modules/trading/domain/types/new-order.props';
import { OrderSide } from '@modules/trading/domain/types/order-side.type';
import { OrderStatus } from '@modules/trading/domain/types/order-status.type';
import { OrderType } from '@modules/trading/domain/types/order-type.type';
import { OrderProps } from '@modules/trading/domain/types/order.props';
import { RejectionReason } from '@modules/trading/domain/types/rejection-reason.type';
import { OrderId } from '@modules/trading/domain/value-objects/order-id';
import { InstrumentId } from '@shared/domain/value-objects/instrument-id';
import { Money } from '@shared/domain/value-objects/money';
import { Quantity } from '@shared/domain/value-objects/quantity';
import { UserId } from '@shared/domain/value-objects/user-id';

/** Desde qué estado se puede llegar a cuál. Solo NEW tiene salida. */
const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  NEW: ['FILLED', 'REJECTED', 'CANCELLED'],
  FILLED: [],
  REJECTED: [],
  CANCELLED: [],
};

/** Orden de compra o venta. Valida sus transiciones de estado; `updatedAt` es la fecha del último cambio. */
export class Order {
  private constructor(
    private props: OrderProps,
    readonly isNew: boolean,
  ) {}

  static create(input: NewOrder, now: Date): Order {
    return new Order({ ...input, status: 'NEW', rejectionReason: null, createdAt: now, updatedAt: now }, true);
  }

  static restore(props: OrderProps): Order {
    return new Order({ ...props }, false);
  }

  get id(): OrderId {
    return this.props.id;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get instrumentId(): InstrumentId {
    return this.props.instrumentId;
  }

  get side(): OrderSide {
    return this.props.side;
  }

  get type(): OrderType {
    return this.props.type;
  }

  get size(): Quantity {
    return this.props.size;
  }

  get price(): Money {
    return this.props.price;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get requestHash(): string | null {
    return this.props.requestHash;
  }

  /** Importe de la orden: cantidad por precio. */
  amount(): Money {
    return this.props.price.times(this.props.size.value);
  }

  /**
   * Resultado de aplicar la orden sobre la cuenta. Aceptada: una MARKET queda FILLED
   * y una LIMIT sigue NEW (comprometió recursos). Rechazada: REJECTED con el motivo.
   */
  applyOutcome(outcome: ExecutionOutcome, now: Date): void {
    if (!outcome.accepted) {
      this.reject(outcome.reason, now);
      return;
    }
    if (this.props.type === 'MARKET') {
      this.fill(now);
    }
  }

  fill(now: Date): void {
    this.transition('FILLED', now);
  }

  reject(reason: RejectionReason, now: Date): void {
    this.transition('REJECTED', now);
    this.props.rejectionReason = reason;
  }

  cancel(now: Date): void {
    if (this.props.status !== 'NEW') {
      throw new OrderNotCancellableError();
    }
    this.transition('CANCELLED', now);
  }

  toProps(): Readonly<OrderProps> {
    return { ...this.props };
  }

  private transition(to: OrderStatus, now: Date): void {
    const from = this.props.status;
    if (!TRANSITIONS[from].includes(to)) {
      throw new InvalidOrderTransitionError(from, to);
    }
    this.props.status = to;
    this.props.updatedAt = now;
  }
}
