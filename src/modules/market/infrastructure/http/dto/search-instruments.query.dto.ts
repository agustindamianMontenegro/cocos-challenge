import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchInstrumentsQueryDto {
  @ApiProperty({ example: 'ypf', description: 'Ticker o parte del nombre.' })
  @IsOptional()
  @IsString({ message: 'search tiene que ser un texto.' })
  search?: string;
}
