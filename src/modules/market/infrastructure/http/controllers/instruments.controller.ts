import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchInstrumentsUseCase } from '@modules/market/application/ports/in/interfaces/search-instruments.use-case';
import { SEARCH_INSTRUMENTS } from '@modules/market/application/ports/in/tokens';
import { InstrumentResponseDto } from '@modules/market/infrastructure/http/dto/instrument.response.dto';
import { SearchInstrumentsQueryDto } from '@modules/market/infrastructure/http/dto/search-instruments.query.dto';
import { toInstrumentResponse } from '@modules/market/infrastructure/http/mappers/instrument-response.mapper';

/** Adaptador HTTP: solo conoce el puerto de entrada. */
@ApiTags('Instrumentos')
@Controller('instruments')
export class InstrumentsController {
  constructor(@Inject(SEARCH_INSTRUMENTS) private readonly searchInstruments: SearchInstrumentsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Buscar instrumentos por ticker o nombre' })
  @ApiOkResponse({ type: InstrumentResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Falta la búsqueda o viene vacía.' })
  async search(@Query() query: SearchInstrumentsQueryDto): Promise<InstrumentResponseDto[]> {
    return (await this.searchInstruments.execute(query.search)).map(toInstrumentResponse);
  }
}
