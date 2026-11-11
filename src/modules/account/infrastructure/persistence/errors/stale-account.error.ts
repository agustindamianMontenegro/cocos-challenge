/**
 * Errores técnicos de la persistencia de la cuenta. No son errores de negocio:
 * nunca se convierten en una orden REJECTED; la API responde 5xx y se deshace todo.
 */
export class StaleAccountError extends Error {
  constructor(userId: number, expectedVersion: number) {
    super(
      `La cuenta ${userId} cambió mientras se operaba (se esperaba la versión ${expectedVersion}).`,
    );
    this.name = 'StaleAccountError';
  }
}
