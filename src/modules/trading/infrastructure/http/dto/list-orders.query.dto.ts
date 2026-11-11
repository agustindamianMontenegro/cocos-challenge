import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ORDER_STATUSES } from '@modules/trading/domain/constants/order.constants';
import { OrderStatus } from '@modules/trading/domain/types/order.types';

const USER_ID_MESSAGE = 'userId es obligatorio y tiene que ser un entero mayor a cero.';

/** Forma de la query. Solo valida tipos; los rangos de la página los controla el caso de uso. */
export class ListOrdersQueryDto {
  @ApiProperty({ example: 1, description: 'Usuario dueño de las órdenes.' })
  @Type(() => Number)
  @IsInt({ message: USER_ID_MESSAGE })
  @Min(1, { message: USER_ID_MESSAGE })
  userId!: number;

  @ApiPropertyOptional({ enum: ORDER_STATUSES, description: 'Solo las órdenes en este estado (por ejemplo, NEW).' })
  @IsOptional()
  @IsIn(ORDER_STATUSES, { message: 'status tiene que ser NEW, FILLED, REJECTED o CANCELLED.' })
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 20, description: 'Órdenes por página, de 1 a 50. Por defecto, 20.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit tiene que ser un entero entre 1 y 50.' })
  limit?: number;

  @ApiPropertyOptional({ example: 0, description: 'Cuántas órdenes saltear. Por defecto, 0.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset tiene que ser un entero mayor o igual a cero.' })
  offset?: number;
}
