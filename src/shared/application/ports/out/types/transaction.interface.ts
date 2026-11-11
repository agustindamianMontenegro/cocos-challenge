declare const transactionBrand: unique symbol;

/**
 * Transacción abierta. Es opaca para la aplicación: solo la infraestructura
 * sabe qué hay adentro. Así los casos de uso no dependen del ORM.
 */
export interface Transaction {
  readonly [transactionBrand]: true;
}
