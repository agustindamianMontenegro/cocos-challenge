import { AccountCommand } from '@modules/account/application/ports/in/commands/account.command';
import { MigratedOrder } from '@modules/migration/application/ports/out/records/migrated-order.record';

/** La orden migrada más lo que hay que pedirle a la cuenta (nada, si no mueve recursos). */
export interface PlannedOrder extends MigratedOrder {
  command: AccountCommand | null;
}
