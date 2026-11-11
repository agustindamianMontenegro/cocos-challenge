import { MigrationReport } from '@modules/migration/application/ports/in/views/migration-report.view';

/** Lo que hizo la migración, sin la conciliación. */
export type MigrationStats = Omit<MigrationReport, 'accounts'>;
