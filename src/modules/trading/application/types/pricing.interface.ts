import { Money } from '@shared/domain/value-objects/money';
import { Quantity } from '@shared/domain/value-objects/quantity';

/** Precio de ejecución, cantidad resuelta y huella del pedido. */
export interface Pricing {
  price: Money;
  size: Quantity;
  hash: string;
}
