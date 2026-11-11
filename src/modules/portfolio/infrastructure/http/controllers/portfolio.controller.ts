import { BadRequestException, Controller, Get, Inject, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPortfolioUseCase } from '@modules/portfolio/application/ports/in/interfaces/get-portfolio.use-case';
import { GET_PORTFOLIO } from '@modules/portfolio/application/ports/in/tokens';
import { PortfolioResponseDto } from '@modules/portfolio/infrastructure/http/dto/portfolio.response.dto';
import { toPortfolioResponse } from '@modules/portfolio/infrastructure/http/mappers/portfolio-response.mapper';

const userIdPipe = new ParseIntPipe({
  exceptionFactory: () => new BadRequestException('userId tiene que ser un entero.'),
});

/** Adaptador HTTP: solo conoce el puerto de entrada. */
@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(@Inject(GET_PORTFOLIO) private readonly getPortfolio: GetPortfolioUseCase) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Valor de la cuenta, pesos disponibles y posiciones con su rendimiento' })
  @ApiOkResponse({ type: PortfolioResponseDto })
  @ApiBadRequestResponse({ description: 'userId no es un entero.' })
  @ApiNotFoundResponse({ description: 'El usuario no existe.' })
  async get(@Param('userId', userIdPipe) userId: number): Promise<PortfolioResponseDto> {
    return toPortfolioResponse(await this.getPortfolio.execute(userId));
  }
}
