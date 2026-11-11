/** Búsqueda de instrumentos. Sin limit u offset se usan los valores por defecto. */
export interface SearchInstrumentsCommand {
  search?: string;
  /** Cuántos resultados devolver (1 a 50; por defecto, 20). */
  limit?: number;
  /** Cuántos resultados saltear desde el principio (por defecto, 0). */
  offset?: number;
}
