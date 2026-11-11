import { ApiProperty } from '@nestjs/swagger';
import { OrderResponseDto } from '@modules/trading/infrastructure/http/dto/order.response.dto';

export class OrderPageResponseDto {
  @ApiProperty({ type: OrderResponseDto, isArray: true, description: 'De la más reciente a la más antigua.' })
  items!: OrderResponseDto[];

  @ApiProperty({ example: 11, description: 'Total de órdenes que cumplen el filtro, en todas las páginas.' })
  total!: number;

  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 0 }) offset!: number;
}
