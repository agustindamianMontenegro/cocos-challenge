/** Error que frena la migración: algo en los datos no se puede importar sin decidirlo antes. */
export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationError';
  }
}
