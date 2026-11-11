import { UserRecord } from '@modules/account/application/ports/out/records/user.record';

/** Puerto de salida: lectura de usuarios (cada usuario tiene una cuenta). */
export interface UserRepository {
  findById(userId: number): Promise<UserRecord | null>;
}

