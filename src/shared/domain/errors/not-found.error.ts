import { DomainError } from './domain.error';

/**
 * Categorías de errores de negocio. La API traduce cada una a un código HTTP
 * sin que el dominio sepa nada de HTTP.
 */
export abstract class NotFoundError extends DomainError {}
