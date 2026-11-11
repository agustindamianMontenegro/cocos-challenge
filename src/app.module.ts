import { Module } from '@nestjs/common';
import { AccountModule } from './modules/account/account.module';
import { MarketModule } from './modules/market/market.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { TradingModule } from './modules/trading/trading.module';
import { DatabaseModule } from './database/database.module';

/** Raíz de la API HTTP. La migración tiene su propio composition root (MigrationModule). */
@Module({
  imports: [DatabaseModule, AccountModule, MarketModule, TradingModule, PortfolioModule],
})
export class AppModule {}
