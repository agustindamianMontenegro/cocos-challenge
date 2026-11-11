import { DataSource, In } from 'typeorm';
import { MarketDataRepository } from '@modules/market/application/ports/out/interfaces/market-data.repository.port';
import { CURRENCY_TYPE } from '@modules/market/domain/services/currency';
import { Instrument } from '@modules/market/domain/types/instrument.interface';
import { Quote } from '@modules/market/domain/value-objects/quote';
import { InstrumentRow } from '@modules/market/infrastructure/persistence/rows/instrument.row';
import { QuoteRow } from '@modules/market/infrastructure/persistence/rows/quote.row';
import { InstrumentSchema } from '@modules/market/infrastructure/persistence/schemas/instrument.schema';
import { Money } from '@shared/domain/value-objects/money';

/**
 * `lower(x) LIKE lower(término)` equivale a ILIKE y aprovecha los índices
 * trigram sobre lower(ticker) y lower(name).
 */
const SEARCH_SQL = `
  SELECT id, ticker, name, type
  FROM instruments
  WHERE (lower(ticker) LIKE $1 ESCAPE '\\' OR lower(name) LIKE $1 ESCAPE '\\')
    AND type IS DISTINCT FROM $2
  ORDER BY ticker, id
  LIMIT $3`;

/** Última cotización con cierre por instrumento: fecha más reciente y, a igual fecha, id mayor. */
const LATEST_QUOTES_SQL = `
  SELECT DISTINCT ON (instrumentid)
         instrumentid AS "instrumentId", close, previousclose AS "previousClose", date
  FROM marketdata
  WHERE instrumentid = ANY($1::int[]) AND close IS NOT NULL
  ORDER BY instrumentid, date DESC NULLS LAST, id DESC`;

/** Adaptador del puerto MarketDataRepository sobre instruments y marketdata. */
export class TypeOrmMarketDataRepository implements MarketDataRepository {
  constructor(private readonly dataSource: DataSource) {}

  async searchInstruments(term: string, limit: number): Promise<Instrument[]> {
    const pattern = `%${escapeLike(term.toLowerCase())}%`;
    const rows: InstrumentRow[] = await this.dataSource.query(SEARCH_SQL, [pattern, CURRENCY_TYPE, limit]);
    return rows.map(toInstrument);
  }

  async findInstruments(ids: readonly number[]): Promise<Map<number, Instrument>> {
    const rows = await this.dataSource.manager.findBy(InstrumentSchema, { id: In([...ids]) });
    return new Map(rows.map((row) => [row.id, toInstrument(row)]));
  }

  /** Se ignoran las cotizaciones sin cierre: no se inventan precios. */
  async latestQuotes(ids: readonly number[]): Promise<Map<number, Quote>> {
    if (ids.length === 0) {
      return new Map();
    }
    const rows: QuoteRow[] = await this.dataSource.query(LATEST_QUOTES_SQL, [[...ids]]);
    return new Map(rows.map((row) => [row.instrumentId, toQuote(row)]));
  }
}

function toInstrument(row: InstrumentRow): Instrument {
  return { id: row.id, ticker: row.ticker ?? '', name: row.name ?? '', type: row.type ?? '' };
}

/** NUMERIC llega como texto: Money lo toma sin pasar por float. */
function toQuote(row: QuoteRow): Quote {
  const previousClose = row.previousClose === null ? null : Money.of(row.previousClose);
  return new Quote(row.instrumentId, Money.of(row.close), previousClose, row.date);
}

/** Los comodines del usuario (% y _) se buscan como texto. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
