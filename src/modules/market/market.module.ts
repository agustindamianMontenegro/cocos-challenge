import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MARKET_QUERIES, SEARCH_INSTRUMENTS } from './application/ports/in/tokens';
import { MarketDataRepository } from './application/ports/out/interfaces/market-data.repository.port';
import { MARKET_DATA_REPOSITORY } from './application/ports/out/tokens';
import { MarketQueriesService } from './application/use-cases/market-queries.service';
import { SearchInstrumentsService } from './application/use-cases/search-instruments.service';
import { InstrumentsController } from './infrastructure/http/controllers/instruments.controller';
import { TypeOrmMarketDataRepository } from '@modules/market/infrastructure/persistence/repositories/typeorm-market-data.repository';

/** Composition root del módulo Market. Hacia afuera solo exporta MARKET_QUERIES. */
@Module({
  controllers: [InstrumentsController],
  providers: [
    {
      provide: MARKET_DATA_REPOSITORY,
      useFactory: (dataSource: DataSource) => new TypeOrmMarketDataRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: SEARCH_INSTRUMENTS,
      useFactory: (marketData: MarketDataRepository) => new SearchInstrumentsService(marketData),
      inject: [MARKET_DATA_REPOSITORY],
    },
    {
      provide: MARKET_QUERIES,
      useFactory: (marketData: MarketDataRepository) => new MarketQueriesService(marketData),
      inject: [MARKET_DATA_REPOSITORY],
    },
  ],
  exports: [MARKET_QUERIES],
})
export class MarketModule {}
