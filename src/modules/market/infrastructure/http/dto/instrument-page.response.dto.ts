import { ApiProperty } from '@nestjs/swagger';
import { InstrumentResponseDto } from '@modules/market/infrastructure/http/dto/instrument.response.dto';

export class InstrumentPageResponseDto {
  @ApiProperty({ type: InstrumentResponseDto, isArray: true }) items!: InstrumentResponseDto[];
  @ApiProperty({ example: 7, description: 'Total de coincidencias en todas las páginas.' }) total!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 0 }) offset!: number;
}
