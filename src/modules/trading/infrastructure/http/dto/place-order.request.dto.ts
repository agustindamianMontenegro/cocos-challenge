import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import { ORDER_TYPES, TRADE_SIDES } from '@modules/trading/domain/constants/order.constants';
import { OrderType, TradeSide } from '@modules/trading/domain/types/order.types';

/** Importe en pesos como texto, con hasta dos decimales. */
const DECIMAL = /^\d+(\.\d{1,2})?$/;
const DECIMAL_MESSAGE = 'tiene que ser un importe en texto con hasta dos decimales, por ejemplo "10000.00".';

/** Forma del pedido HTTP. Solo valida tipos y formato; las reglas de negocio están en el dominio. */
export class PlaceOrderRequestDto {
  @ApiProperty({ example: '01934f7a-2b6c-7d2e-9a10-5c3e8f7b1a42', description: 'UUIDv7 generado por el cliente.' })
  @IsUUID('7', { message: 'orderId tiene que ser un UUIDv7.' })
  orderId!: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'userId tiene que ser un entero.' })
  @Min(1, { message: 'userId tiene que ser mayor a cero.' })
  userId!: number;

  @ApiProperty({ example: 47 })
  @IsInt({ message: 'instrumentId tiene que ser un entero.' })
  @Min(1, { message: 'instrumentId tiene que ser mayor a cero.' })
  instrumentId!: number;

  @ApiProperty({ enum: TRADE_SIDES })
  @IsIn(TRADE_SIDES, { message: 'side tiene que ser BUY o SELL.' })
  side!: TradeSide;

  @ApiProperty({ enum: ORDER_TYPES })
  @IsIn(ORDER_TYPES, { message: 'type tiene que ser MARKET o LIMIT.' })
  type!: OrderType;

  @ApiPropertyOptional({ example: 10, description: 'Cantidad de acciones. Excluyente con amount.' })
  @IsOptional()
  @IsInt({ message: 'size tiene que ser un entero.' })
  size?: number;

  @ApiPropertyOptional({ example: '10000.00', description: 'Monto en pesos. Excluyente con size.' })
  @IsOptional()
  @IsString({ message: `amount ${DECIMAL_MESSAGE}` })
  @Matches(DECIMAL, { message: `amount ${DECIMAL_MESSAGE}` })
  amount?: string;

  @ApiPropertyOptional({ example: '240.00', description: 'Precio límite. Solo en órdenes LIMIT.' })
  @IsOptional()
  @IsString({ message: `price ${DECIMAL_MESSAGE}` })
  @Matches(DECIMAL, { message: `price ${DECIMAL_MESSAGE}` })
  price?: string;
}
