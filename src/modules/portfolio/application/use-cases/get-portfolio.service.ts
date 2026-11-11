import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { AccountPosition } from '@modules/account/application/ports/in/views/account-position.view';
import { MarketQueriesPort } from '@modules/market/application/ports/in/interfaces/market-queries.port';
import { InstrumentPriceView } from '@modules/market/application/ports/in/views/instrument-price.view';
import { GetPortfolioUseCase } from '@modules/portfolio/application/ports/in/interfaces/get-portfolio.use-case';
import { PortfolioView } from '@modules/portfolio/application/ports/in/views/portfolio.view';
import { valuePortfolio } from '@modules/portfolio/domain/services/portfolio-valuator';
import { Holding } from '@modules/portfolio/domain/types/holding.interface';

/** Junta el estado de la cuenta (Account) con los precios (Market). Solo lee. */
export class GetPortfolioService implements GetPortfolioUseCase {
  constructor(
    private readonly accounts: AccountQueriesPort,
    private readonly market: MarketQueriesPort,
  ) {}

  async execute(userId: number): Promise<PortfolioView> {
    const summary = await this.accounts.getSummary(userId);
    const prices = await this.market.findInstrumentPrices(summary.positions.map((p) => p.instrumentId));
    const holdings = summary.positions.map((position) => toHolding(position, prices.get(position.instrumentId)));
    return {
      userId: summary.userId,
      accountNumber: summary.accountNumber,
      valuation: valuePortfolio(summary.balance, holdings),
    };
  }
}

/** Si Market no conoce el instrumento, la posición queda sin nombre ni precio: no se inventan. */
const UNKNOWN_INSTRUMENT = { ticker: '', name: '', lastPrice: null, previousClose: null };

function toHolding(position: AccountPosition, price?: InstrumentPriceView): Holding {
  const { ticker, name, lastPrice, previousClose } = price ?? UNKNOWN_INSTRUMENT;
  return { ...position, ticker, name, lastPrice, previousClose };
}
