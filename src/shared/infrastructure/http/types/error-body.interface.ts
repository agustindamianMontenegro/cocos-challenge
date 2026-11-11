/** Forma única de los errores de la API. */
export interface ErrorBody {
  error: { code: string; message: string };
}
