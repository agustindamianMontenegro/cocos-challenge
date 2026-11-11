import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { formatPercent } from '@shared/domain/services/percentage';
import { Money } from '@shared/domain/value-objects/money';
import { instrument, marketWith } from '@test/support/doubles/fake-market-queries';
import { GetPortfolioService } from './get-portfolio.service';

const accounts: AccountQueriesPort = {
  assertUserExists: async () => undefined,
  getSummary: async (userId) => ({
    userId,
    accountNumber: '10001',
    balance: { total: Money.of(1_000), reserved: Money.of(100), available: Money.of(900) },
    positions: [
      { instrumentId: 47, quantity: 10, cost: Money.of(9_000) },
      { instrumentId: 10, quantity: 1, cost: Money.of(100) },
    ],
  }),
};

describe('GetPortfolioService', () => {
  it('valúa con los precios de Market y marca la valuación incompleta si falta uno', async () => {
    const service = new GetPortfolioService(accounts, marketWith({ ...instrument(47, '950'), ticker: 'PAMP' }, instrument(10, null)));

    const { accountNumber, valuation } = await service.execute(1);

    expect(accountNumber).toBe('10001');
    expect(valuation.valuationComplete).toBe(false);
    expect(valuation.totalValue).toBeNull();
    expect(valuation.positions[0]).toMatchObject({ ticker: 'PAMP', quantity: 10 });
    expect(valuation.positions[0].marketValue?.toFixed()).toBe('9500.00');
    expect(formatPercent(valuation.positions[0].totalReturnPct)).toBe('5.56');
  });

  it('con todos los precios suma saldo total y posiciones', async () => {
    const service = new GetPortfolioService(accounts, marketWith(instrument(47, '950'), instrument(10, '200')));
    expect((await service.execute(1)).valuation.totalValue?.toFixed()).toBe('10700.00');
  });
});
