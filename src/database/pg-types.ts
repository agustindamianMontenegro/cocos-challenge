import { types } from 'pg';

const TIMESTAMP_WITHOUT_TIME_ZONE = 1114;
const DATE = 1082;

/**
 * database.sql usa TIMESTAMP y DATE sin zona horaria. Por defecto el driver pg los interpreta
 * en la zona del servidor de la app, así que la misma orden tendría otra fecha según dónde corra.
 * Se leen siempre como UTC.
 */
export function readDatesAsUtc(): void {
  types.setTypeParser(TIMESTAMP_WITHOUT_TIME_ZONE, (value) => new Date(`${value.replace(' ', 'T')}Z`));
  types.setTypeParser(DATE, (value) => new Date(`${value}T00:00:00Z`));
}
