import { PortfolioView } from '@modules/portfolio/application/ports/in/views/portfolio.view';

/** Puerto de entrada: portfolio de un usuario (lanza UserNotFoundError si no existe). */
export interface GetPortfolioUseCase {
  execute(userId: number): Promise<PortfolioView>;
}

