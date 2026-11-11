import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Versión de esquema de los hechos y de las fotos de la cuenta. Si un hecho cambia de forma,
 * se sube su versión y se agrega un upcaster; las fotos de otra versión se ignoran.
 */
export class EventSchemaVersion1730000000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "account_events" ADD COLUMN IF NOT EXISTS "schemaVersion" INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE "account_snapshots" ADD COLUMN IF NOT EXISTS "schemaVersion" INTEGER NOT NULL DEFAULT 1;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "account_events" DROP COLUMN IF EXISTS "schemaVersion";
        ALTER TABLE "account_snapshots" DROP COLUMN IF EXISTS "schemaVersion";
    `);
  }
}
