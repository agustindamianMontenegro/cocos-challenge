export class CorruptedAccountStreamError extends Error {
  constructor(detail: string) {
    super(`La historia de la cuenta es inconsistente: ${detail}`);
    this.name = 'CorruptedAccountStreamError';
  }
}
