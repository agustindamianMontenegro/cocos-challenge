/** El orderId ya existe en la base (otra transacción lo guardó primero). Es técnico, no de negocio. */
export class DuplicateOrderIdError extends Error {
  constructor(readonly orderId: string) {
    super(`Ya existe una orden con id ${orderId}.`);
    this.name = 'DuplicateOrderIdError';
  }
}
