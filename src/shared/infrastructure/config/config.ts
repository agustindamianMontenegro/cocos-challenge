/** Lectura de variables de entorno con validación. Falla al arrancar, no en medio de una operación. */
export function requiredEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
}

export function positiveIntEnv(
  name: string,
  fallback: number,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`La variable de entorno ${name} tiene que ser un entero mayor a cero.`);
  }
  return value;
}
