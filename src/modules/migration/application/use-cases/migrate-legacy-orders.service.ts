import { MigrateLegacyOrdersUseCase } from '@modules/migration/application/ports/in/interfaces/migrate-legacy-orders.use-case';
import { AccountReconciliation } from '@modules/migration/application/ports/in/views/account-reconciliation.view';
import { MigrationReport } from '@modules/migration/application/ports/in/views/migration-report.view';
import { planLegacyOrder } from '@modules/migration/application/services/legacy-order.planner';
import { MigrateLegacyOrdersDependencies } from '@modules/migration/application/types/migrate-legacy-orders.dependencies';
import { MigrationStats } from '@modules/migration/application/types/migration-stats.type';
import { PlannedOrder } from '@modules/migration/application/types/planned-order.interface';
import { MigrationError } from '@modules/migration/domain/errors/migration.error';
import { naiveBalances } from '@modules/migration/domain/services/naive-balances';
import { LegacyOrder } from '@modules/migration/domain/types/legacy-order.interface';
import { Transaction } from '@shared/application/ports/out/types/transaction.interface';

/**
 * Importa orders_legacy (ADR-001 §8) en una transacción: órdenes con UUID fijo,
 * hechos de la cuenta con su fecha original, correcciones, compromisos de las LIMIT
 * pendientes y una foto inicial por cuenta. Si ya se migró, no hace nada.
 */
export class MigrateLegacyOrdersService implements MigrateLegacyOrdersUseCase {
  constructor(private readonly deps: MigrateLegacyOrdersDependencies) {}

  async execute(): Promise<MigrationReport> {
    const legacy = await this.deps.legacyOrders.loadLegacyOrders();
    const stats = await this.deps.unitOfWork.run((tx) => this.migrate(tx, legacy));
    return { ...stats, accounts: await this.reconcile(legacy) };
  }

  private async migrate(tx: Transaction, legacy: LegacyOrder[]): Promise<MigrationStats> {
    if (await this.deps.legacyOrders.hasMigratedOrders(tx)) {
      return { alreadyMigrated: true, importedOrders: 0, corrections: 0 };
    }
    let corrections = 0;
    for (const [userId, orders] of groupByUser(legacy)) {
      corrections += await this.migrateAccount(tx, userId, orders);
    }
    return { alreadyMigrated: false, importedOrders: legacy.length, corrections };
  }

  private async migrateAccount(tx: Transaction, userId: number, orders: LegacyOrder[]): Promise<number> {
    const { version } = await this.deps.accountCommands.lock(tx, userId);
    if (version !== 0) {
      throw new MigrationError(`La cuenta ${userId} ya tiene hechos: no se puede migrar encima.`);
    }
    let corrections = 0;
    for (const planned of orders.map(planLegacyOrder)) {
      await this.applyToAccount(tx, planned);
      await this.deps.legacyOrders.saveMigratedOrder(tx, planned);
      if (planned.correction) {
        await this.deps.legacyOrders.saveCorrection(tx, planned);
        corrections += 1;
      }
    }
    await this.deps.accountCommands.takeSnapshot(tx, userId);
    return corrections;
  }

  private async applyToAccount(tx: Transaction, planned: PlannedOrder): Promise<void> {
    if (!planned.command) {
      return;
    }
    const { legacy } = planned;
    const context = { orderId: planned.orderId, occurredAt: legacy.datetime };
    const result = await this.deps.accountCommands.execute(tx, legacy.userId, planned.command, context);
    if (!result.applied) {
      throw new MigrationError(
        `La orden ${legacy.id} (${legacy.side} ${legacy.status}) no se puede importar: ${result.reason}. ` +
          'La migración se frena: hay que decidir cómo tratarla (ver legacy-corrections.ts).',
      );
    }
  }

  /** Reporte de conciliación: el cálculo ingenuo frente a la cuenta migrada. */
  private async reconcile(legacy: LegacyOrder[]): Promise<AccountReconciliation[]> {
    const report: AccountReconciliation[] = [];
    for (const [userId, orders] of groupByUser(legacy)) {
      const { balance, positions } = await this.deps.accountQueries.getSummary(userId);
      report.push({
        userId,
        original: naiveBalances(orders),
        corrected: {
          cash: balance.total.toFixed(),
          reserved: balance.reserved.toFixed(),
          available: balance.available.toFixed(),
          holdings: Object.fromEntries(positions.map((p) => [p.instrumentId, p.quantity])),
        },
      });
    }
    return report;
  }
}

function groupByUser(orders: LegacyOrder[]): Map<number, LegacyOrder[]> {
  const groups = new Map<number, LegacyOrder[]>();
  orders.forEach((order) => groups.set(order.userId, [...(groups.get(order.userId) ?? []), order]));
  return groups;
}
