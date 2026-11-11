import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createDataSource } from '@src/database/create-data-source';
import { UNIT_OF_WORK } from '@shared/application/ports/out/tokens';
import { TypeOrmUnitOfWork } from '@shared/infrastructure/persistence/typeorm-unit-of-work';

/**
 * Composition root de la persistencia: crea el DataSource de TypeORM (con las tablas de
 * todos los módulos) y el adaptador de UnitOfWork. Los repositorios reciben el DataSource.
 */
@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useFactory: async () => createDataSource().initialize(),
    },
    {
      provide: UNIT_OF_WORK,
      useFactory: (dataSource: DataSource) => new TypeOrmUnitOfWork(dataSource),
      inject: [DataSource],
    },
  ],
  exports: [DataSource, UNIT_OF_WORK],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
