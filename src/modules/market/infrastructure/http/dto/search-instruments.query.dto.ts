import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

/** Forma de la query. Solo valida tipos; los rangos de la página los controla el caso de uso. */
export class SearchInstrumentsQueryDto {
  @ApiProperty({ example: 'ypf', description: 'Ticker o parte del nombre.' })
  @IsOptional()
  @IsString({ message: 'search tiene que ser un texto.' })
  search?: string;

  @ApiPropertyOptional({ example: 20, description: 'Resultados por página, de 1 a 50. Por defecto, 20.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit tiene que ser un entero entre 1 y 50.' })
  limit?: number;

  @ApiPropertyOptional({ example: 0, description: 'Cuántos resultados saltear. Por defecto, 0.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset tiene que ser un entero mayor o igual a cero.' })
  offset?: number;
}
