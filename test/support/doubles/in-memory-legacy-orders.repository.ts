import { LegacyOrdersRepository } from '@modules/migration/application/ports/out/interfaces/legacy-orders.repository.port';
import { MigratedOrder } from '@modules/migration/application/ports/out/records/migrated-order.record';
import { LegacyOrder } from '@modules/migration/domain/types/legacy-order.interface';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

export class InMemoryLegacyOrdersRepository implements LegacyOrdersRepository {
  readonly migrated: MigratedOrder[] = [];
  readonly corrections: MigratedOrder[] = [];

  constructor(private readonly legacy: LegacyOrder[]) {}

  async loadLegacyOrders(): Promise<LegacyOrder[]> {
    return this.legacy;
  }

  async hasMigratedOrders(_tx: Transaction): Promise<boolean> {
    return this.migrated.length > 0;
  }

  async saveMigratedOrder(_tx: Transaction, order: MigratedOrder): Promise<void> {
    this.migrated.push(order);
  }

  async saveCorrection(_tx: Transaction, order: MigratedOrder): Promise<void> {
    this.corrections.push(order);
  }
}
