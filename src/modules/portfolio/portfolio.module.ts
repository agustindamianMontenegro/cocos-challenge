import { Module } from '@nestjs/common';
import { AccountModule } from '@modules/account/account.module';
import { AccountQueriesPort } from '@modules/account/application/ports/in/interfaces/account-queries.port';
import { ACCOUNT_QUERIES } from '@modules/account/application/ports/in/tokens';
import { MarketQueriesPort } from '@modules/market/application/ports/in/interfaces/market-queries.port';
import { MARKET_QUERIES } from '@modules/market/application/ports/in/tokens';
import { MarketModule } from '@modules/market/market.module';
import { GET_PORTFOLIO } from './application/ports/in/tokens';
import { GetPortfolioService } from './application/use-cases/get-portfolio.service';
import { PortfolioController } from './infrastructure/http/controllers/portfolio.controller';

/** Composition root del módulo Portfolio. Solo lee, a través de los puertos de Account y Market. */
@Module({
  imports: [AccountModule, MarketModule],
  controllers: [PortfolioController],
  providers: [
    {
      provide: GET_PORTFOLIO,
      useFactory: (accounts: AccountQueriesPort, market: MarketQueriesPort) => new GetPortfolioService(accounts, market),
      inject: [ACCOUNT_QUERIES, MARKET_QUERIES],
    },
  ],
})
export class PortfolioModule {}
