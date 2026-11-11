import { MigrationInterface, QueryRunner } from 'typeorm';

const ACCOUNT_EVENT_SOURCING_SQL = `
  ALTER TABLE orders RENAME TO orders_legacy;
  ALTER TABLE orders_legacy RENAME CONSTRAINT orders_pkey TO orders_legacy_pkey;
  ALTER TABLE orders_legacy DROP CONSTRAINT IF EXISTS orders_instrumentid_fkey;
  ALTER TABLE orders_legacy DROP CONSTRAINT IF EXISTS orders_userid_fkey;
  ALTER TABLE orders_legacy ALTER COLUMN id DROP DEFAULT;
  DROP SEQUENCE IF EXISTS orders_id_seq;

  CREATE TABLE "orders" (
      "id" UUID NOT NULL,
      "legacyOrderId" INTEGER,
      "userId" INTEGER NOT NULL,
      "instrumentId" INTEGER NOT NULL,
      "side" VARCHAR(10) NOT NULL,
      "type" VARCHAR(10) NOT NULL,
      "size" INTEGER NOT NULL,
      "price" DECIMAL(18,2) NOT NULL,
      "status" VARCHAR(20) NOT NULL,
      "rejectionReason" VARCHAR(40),
      "requestHash" VARCHAR(64),
      "createdAt" TIMESTAMPTZ(3) NOT NULL,
      "updatedAt" TIMESTAMPTZ(3) NOT NULL,
      CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
  );

  CREATE TABLE "account_streams" (
      "userId" INTEGER NOT NULL,
      "version" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "account_streams_pkey" PRIMARY KEY ("userId")
  );

  CREATE TABLE "account_events" (
      "id" BIGSERIAL NOT NULL,
      "userId" INTEGER NOT NULL,
      "version" INTEGER NOT NULL,
      "type" VARCHAR(40) NOT NULL,
      "payload" JSONB NOT NULL,
      "orderId" UUID,
      "occurredAt" TIMESTAMPTZ(3) NOT NULL,
      CONSTRAINT "account_events_pkey" PRIMARY KEY ("id")
  );

  CREATE TABLE "account_snapshots" (
      "userId" INTEGER NOT NULL,
      "version" INTEGER NOT NULL,
      "state" JSONB NOT NULL,
      "createdAt" TIMESTAMPTZ(3) NOT NULL,
      CONSTRAINT "account_snapshots_pkey" PRIMARY KEY ("userId","version")
  );

  CREATE TABLE "migration_corrections" (
      "id" SERIAL NOT NULL,
      "legacyOrderId" INTEGER NOT NULL,
      "field" VARCHAR(40) NOT NULL,
      "originalValue" VARCHAR(40) NOT NULL,
      "correctedValue" VARCHAR(40) NOT NULL,
      "reason" TEXT NOT NULL,
      "appliedAt" TIMESTAMPTZ(3) NOT NULL,
      CONSTRAINT "migration_corrections_pkey" PRIMARY KEY ("id")
  );

  CREATE UNIQUE INDEX "orders_legacyOrderId_key" ON "orders"("legacyOrderId");
  CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");
  CREATE UNIQUE INDEX "account_events_userId_version_key" ON "account_events"("userId", "version");
  CREATE UNIQUE INDEX "migration_corrections_legacyOrderId_field_key" ON "migration_corrections"("legacyOrderId", "field");
  CREATE INDEX "marketdata_instrumentid_date_idx" ON "marketdata"("instrumentid", "date" DESC);

  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX "instruments_ticker_trgm_idx" ON "instruments" USING GIN (lower("ticker") gin_trgm_ops);
  CREATE INDEX "instruments_name_trgm_idx" ON "instruments" USING GIN (lower("name") gin_trgm_ops);

  ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  ALTER TABLE "account_streams" ADD CONSTRAINT "account_streams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  ALTER TABLE "account_events" ADD CONSTRAINT "account_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "account_streams"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
  ALTER TABLE "account_snapshots" ADD CONSTRAINT "account_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "account_streams"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
`;

/**
 * ADR-001, sección 7: orders pasa a ser orders_legacy (intacta) y se crean la nueva orders,
 * las tablas de la cuenta con Event Sourcing, las correcciones y los índices.
 * Si la base ya la tenía aplicada (por ejemplo, con las migraciones anteriores de Prisma), no hace nada.
 */
export class AccountEventSourcing1730000000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const [{ exists }] = await queryRunner.query("SELECT to_regclass('public.orders_legacy') IS NOT NULL AS exists");
    if (exists) {
      return;
    }
    await queryRunner.query(ACCOUNT_EVENT_SOURCING_SQL);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP TABLE IF EXISTS "account_snapshots", "account_events", "account_streams",
          "orders", "migration_corrections";
        DROP INDEX IF EXISTS "marketdata_instrumentid_date_idx", "instruments_ticker_trgm_idx", "instruments_name_trgm_idx";
        ALTER TABLE orders_legacy RENAME TO orders;
        ALTER TABLE orders RENAME CONSTRAINT orders_legacy_pkey TO orders_pkey;
        CREATE SEQUENCE orders_id_seq OWNED BY orders.id;
        SELECT setval('orders_id_seq', COALESCE(MAX(id), 1)) FROM orders;
        ALTER TABLE orders ALTER COLUMN id SET DEFAULT nextval('orders_id_seq');
        ALTER TABLE orders ADD FOREIGN KEY (instrumentid) REFERENCES instruments(id);
        ALTER TABLE orders ADD FOREIGN KEY (userid) REFERENCES users(id);
    `);
  }
}
