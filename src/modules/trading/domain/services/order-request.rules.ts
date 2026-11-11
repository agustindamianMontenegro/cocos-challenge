import Decimal from 'decimal.js';
import { InvalidOrderError } from '@modules/trading/domain/errors/invalid-order.error';
import { OrderRequest } from '@modules/trading/domain/types/order-request.interface';
import { Money } from '@shared/domain/value-objects/money';
import { Quantity } from '@shared/domain/value-objects/quantity';

type Rule = [broken: (request: OrderRequest) => boolean, message: string];

const RULES: readonly Rule[] = [
  [(r) => r.size !== undefined && r.amount !== undefined, 'Indicá size o amount, no los dos.'],
  [(r) => r.size === undefined && r.amount === undefined, 'Indicá size (cantidad de acciones) o amount (monto en pesos).'],
  [(r) => r.size !== undefined && !Quantity.isValid(r.size), 'size tiene que ser un entero mayor a cero.'],
  [(r) => r.amount !== undefined && !isPositive(r.amount), 'amount tiene que ser mayor a cero.'],
  [(r) => r.type === 'MARKET' && r.price !== undefined, 'Una orden MARKET no lleva price: se ejecuta al último precio de cierre.'],
  [(r) => r.type === 'LIMIT' && r.price === undefined, 'Una orden LIMIT necesita price.'],
  [(r) => r.price !== undefined && !isPositive(r.price), 'price tiene que ser mayor a cero.'],
];

/** Reglas del pedido que no dependen del precio ni de la cuenta. */
export function validateOrderRequest(request: OrderRequest): void {
  const broken = RULES.find(([isBroken]) => isBroken(request));
  if (broken) {
    throw new InvalidOrderError(broken[1]);
  }
}

/** Cantidad de acciones: la pedida, o el monto dividido el precio redondeado hacia abajo. */
export function resolveSize(request: OrderRequest, price: Money): Quantity {
  if (request.amount === undefined) {
    return Quantity.of(request.size ?? 0);
  }
  const shares = request.amount.toDecimal().dividedBy(price.toDecimal()).floor();
  if (shares.isZero()) {
    throw new InvalidOrderError(`El monto no alcanza para una acción a $${price.toFixed()}.`);
  }
  return Quantity.of(shares.toNumber());
}

/** Precio límite de una orden LIMIT (las reglas del pedido ya exigieron que venga). */
export function limitPriceOf(request: OrderRequest): Money {
  if (request.price === undefined) {
    throw new InvalidOrderError('Una orden LIMIT necesita price.');
  }
  return request.price;
}

function isPositive(value: Money): boolean {
  return value.toDecimal().greaterThan(new Decimal(0));
}
