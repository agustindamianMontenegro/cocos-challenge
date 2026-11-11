import { UpcasterRegistry } from './upcaster-registry.type';

/** Versiones vigentes y upcasters con los que se leen los hechos (las pruebas los reemplazan). */
export interface EventSchemaOptions {
  currentVersions: Readonly<Record<string, number>>;
  upcasters: UpcasterRegistry;
}
