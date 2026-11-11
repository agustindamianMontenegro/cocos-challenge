import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchInstrumentsUseCase } from '@modules/market/application/ports/in/interfaces/search-instruments.use-case';
import { SEARCH_INSTRUMENTS } from '@modules/market/application/ports/in/tokens';
import { InstrumentPageResponseDto } from '@modules/market/infrastructure/http/dto/instrument-page.response.dto';
import { SearchInstrumentsQueryDto } from '@modules/market/infrastructure/http/dto/search-instruments.query.dto';
import { toInstrumentPageResponse } from '@modules/market/infrastructure/http/mappers/instrument-response.mapper';

/** Adaptador HTTP: solo conoce el puerto de entrada. */
@ApiTags('Instrumentos')
@Controller('instruments')
export class InstrumentsController {
  constructor(@Inject(SEARCH_INSTRUMENTS) private readonly searchInstruments: SearchInstrumentsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Buscar instrumentos por ticker o nombre, con paginación' })
  @ApiOkResponse({ type: InstrumentPageResponseDto })
  @ApiBadRequestResponse({ description: 'Falta la búsqueda, viene vacía o la página no es válida.' })
  async search(@Query() query: SearchInstrumentsQueryDto): Promise<InstrumentPageResponseDto> {
    return toInstrumentPageResponse(await this.searchInstruments.execute(query));
  }
}
