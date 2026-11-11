import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AccountRepository } from '@modules/account/application/ports/out/interfaces/account.repository.port';
import { ACCOUNT_REPOSITORY } from '@modules/account/application/ports/out/tokens';
import { Account } from '@modules/account/domain/entities/account';
import { UnitOfWork } from '@shared/application/ports/out/interfaces/unit-of-work.port';
import { UNIT_OF_WORK } from '@shared/application/ports/out/tokens';
import { Money } from '@shared/domain/value-objects/money';

/**
 * Acceso directo a la cuenta para preparar y verificar las pruebas. Toma el repositorio
 * del contenedor aunque el módulo no lo exporte: es una utilidad de prueba, no código de la app.
 */
export class AccountsFixture {
  constructor(private readonly app: NestFastifyApplication) {}

  deposit(userId: number, amount: string | number): Promise<Account> {
    return this.operate(userId, (account) => account.deposit(Money.of(amount)));
  }

  /** Deja al usuario con esas acciones compradas a ese precio (deposita lo justo para pagarlas). */
  holding(userId: number, instrumentId: number, quantity: number, price: string | number): Promise<Account> {
    return this.operate(userId, (account) => {
      account.deposit(Money.of(price).times(quantity));
      account.buy({ orderId: 'seed', instrumentId, quantity, price: Money.of(price) });
    });
  }

  load(userId: number): Promise<Account> {
    return this.unitOfWork().run((tx) => this.accounts().loadForUpdate(tx, userId));
  }

  private operate(userId: number, change: (account: Account) => void): Promise<Account> {
    return this.unitOfWork().run(async (tx) => {
      const account = await this.accounts().loadForUpdate(tx, userId);
      change(account);
      await this.accounts().save(tx, account);
      return account;
    });
  }

  private unitOfWork(): UnitOfWork {
    return this.app.get<UnitOfWork>(UNIT_OF_WORK, { strict: false });
  }

  private accounts(): AccountRepository {
    return this.app.get<AccountRepository>(ACCOUNT_REPOSITORY, { strict: false });
  }
}
