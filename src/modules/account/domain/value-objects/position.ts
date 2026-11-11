import { Money } from '@shared/domain/value-objects/money';

/**
 * Tenencia de un instrumento con su costo.
 * El precio promedio de compra (PPC) es costo / cantidad.
 */
export class Position {
  static readonly EMPTY = new Position(0, Money.ZERO);

  constructor(
    readonly quantity: number,
    readonly cost: Money,
  ) {}

  /** Una compra suma cantidad y costo; el PPC queda ponderado. */
  buy(quantity: number, price: Money): Position {
    return new Position(this.quantity + quantity, this.cost.plus(price.times(quantity)));
  }

  /**
   * Una venta descarga costo al PPC vigente: las acciones que quedan
   * mantienen el mismo PPC. Si la posición llega a cero, el costo se reinicia.
   */
  sell(quantity: number): Position {
    const remaining = this.quantity - quantity;
    if (remaining === 0) {
      return Position.EMPTY;
    }
    // Se resta lo vendido en lugar de recalcular lo que queda: así el costo total se conserva exacto.
    return new Position(remaining, this.cost.minus(this.averagePrice().times(quantity)));
  }

  averagePrice(): Money {
    return this.quantity === 0 ? Money.ZERO : this.cost.dividedBy(this.quantity);
  }

  /** Ganancia o pérdida de vender `quantity` acciones a `price`. */
  realizedResult(quantity: number, price: Money): Money {
    return price.minus(this.averagePrice()).times(quantity);
  }

  isEmpty(): boolean {
    return this.quantity === 0;
  }
}
