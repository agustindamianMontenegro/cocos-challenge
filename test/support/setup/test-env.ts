import 'dotenv/config';

/**
 * Las pruebas de integración usan su propia base (TEST_DATABASE_URL) y la borran entera.
 * Nunca corren contra DATABASE_URL.
 */
const DEFAULT_TEST_URL = 'postgresql://postgres:postgres@localhost:5432/cocos_test';

export function testDatabaseUrl(): string {
  return process.env['TEST_DATABASE_URL'] ?? DEFAULT_TEST_URL;
}

process.env['DATABASE_URL'] = testDatabaseUrl();
