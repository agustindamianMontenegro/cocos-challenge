/** Una fila de orders tiene un valor fuera de los permitidos. Es técnico: la API responde 500. */
export class CorruptedOrderRecordError extends Error {
  constructor(field: string, value: string) {
    super(`La orden guardada tiene un ${field} inválido: "${value}".`);
    this.name = 'CorruptedOrderRecordError';
  }
}
