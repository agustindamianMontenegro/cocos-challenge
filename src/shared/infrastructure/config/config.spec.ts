import { positiveIntEnv, requiredEnv } from './config';

describe('config', () => {
  it('usa el valor por defecto si la variable no está', () => {
    expect(positiveIntEnv('SNAPSHOT_EVERY', 100, {})).toBe(100);
  });

  it('lee un entero positivo', () => {
    expect(positiveIntEnv('SNAPSHOT_EVERY', 100, { SNAPSHOT_EVERY: '25' })).toBe(25);
  });

  it.each(['0', '-3', '1.5', 'abc'])('rechaza %p', (raw) => {
    expect(() => positiveIntEnv('SNAPSHOT_EVERY', 100, { SNAPSHOT_EVERY: raw })).toThrow(
      'SNAPSHOT_EVERY',
    );
  });

  it('exige las variables obligatorias', () => {
    expect(() => requiredEnv('DATABASE_URL', {})).toThrow('DATABASE_URL');
    expect(requiredEnv('DATABASE_URL', { DATABASE_URL: 'postgres://x' })).toBe('postgres://x');
  });
});
