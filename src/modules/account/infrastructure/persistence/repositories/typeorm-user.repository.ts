import { DataSource } from 'typeorm';
import { UserRepository } from '@modules/account/application/ports/out/interfaces/user.repository.port';
import { UserRecord } from '@modules/account/application/ports/out/records/user.record';
import { UserSchema } from '@modules/account/infrastructure/persistence/schemas/user.schema';

/** Adaptador del puerto UserRepository sobre la tabla users (columnas que aceptan NULL). */
export class TypeOrmUserRepository implements UserRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findById(userId: number): Promise<UserRecord | null> {
    const user = await this.dataSource.manager.findOneBy(UserSchema, { id: userId });
    return user ? { id: user.id, accountNumber: user.accountNumber ?? '' } : null;
  }
}
