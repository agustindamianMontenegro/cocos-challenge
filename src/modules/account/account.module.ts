import { Module } from '@nestjs/common';
import { positiveIntEnv } from '@shared/infrastructure/config/config';
import { DataSource } from 'typeorm';
import { ACCOUNT_COMMANDS, ACCOUNT_QUERIES } from './application/ports/in/tokens';
import { AccountRepository } from './application/ports/out/interfaces/account.repository.port';
import { UserRepository } from './application/ports/out/interfaces/user.repository.port';
import { ACCOUNT_REPOSITORY, USER_REPOSITORY } from './application/ports/out/tokens';
import { AccountCommandsService } from './application/use-cases/account-commands.service';
import { AccountQueriesService } from './application/use-cases/account-queries.service';
import { TypeOrmAccountRepository } from '@modules/account/infrastructure/persistence/repositories/typeorm-account.repository';
import { TypeOrmUserRepository } from '@modules/account/infrastructure/persistence/repositories/typeorm-user.repository';

/** Composition root del módulo Account. Hacia afuera solo exporta sus puertos de entrada. */
@Module({
  providers: [
    {
      provide: ACCOUNT_REPOSITORY,
      useFactory: (dataSource: DataSource) => new TypeOrmAccountRepository(dataSource, positiveIntEnv('SNAPSHOT_EVERY', 100)),
      inject: [DataSource],
    },
    {
      provide: USER_REPOSITORY,
      useFactory: (dataSource: DataSource) => new TypeOrmUserRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: ACCOUNT_COMMANDS,
      useFactory: (accounts: AccountRepository) => new AccountCommandsService(accounts),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: ACCOUNT_QUERIES,
      useFactory: (users: UserRepository, accounts: AccountRepository) => new AccountQueriesService(users, accounts),
      inject: [USER_REPOSITORY, ACCOUNT_REPOSITORY],
    },
  ],
  exports: [ACCOUNT_COMMANDS, ACCOUNT_QUERIES],
})
export class AccountModule {}
