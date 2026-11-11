import { PortfolioValuation } from '@modules/portfolio/domain/types/portfolio-valuation.interface';

/** Portfolio de un usuario: cuenta y valuación. */
export interface PortfolioView {
  userId: number;
  accountNumber: string;
  valuation: PortfolioValuation;
}
