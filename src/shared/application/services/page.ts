import { PageOptions } from '@shared/application/ports/out/options/page.options';
import { InvalidPageError } from '@shared/domain/errors/invalid-page.error';

/** Resultados por página si el cliente no indica limit. */
export const DEFAULT_PAGE_SIZE = 20;

/** Máximo de resultados por página. */
export const MAX_PAGE_SIZE = 50;

/** La página pedida, con los valores por defecto aplicados. */
export function resolvePage(limit: number | undefined, offset: number | undefined): PageOptions {
  const page = { limit: limit ?? DEFAULT_PAGE_SIZE, offset: offset ?? 0 };
  if (!Number.isInteger(page.limit) || page.limit < 1 || page.limit > MAX_PAGE_SIZE) {
    throw new InvalidPageError(`limit tiene que ser un entero entre 1 y ${MAX_PAGE_SIZE}.`);
  }
  if (!Number.isInteger(page.offset) || page.offset < 0) {
    throw new InvalidPageError('offset tiene que ser un entero mayor o igual a cero.');
  }
  return page;
}
