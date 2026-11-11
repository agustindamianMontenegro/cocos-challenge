import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ORDER_TYPES } from '@modules/trading/domain/constants/order.constants';

export class OrderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: number;
  @ApiProperty() instrumentId!: number;
  @ApiProperty({ enum: ['BUY', 'SELL', 'CASH_IN', 'CASH_OUT'] }) side!: string;
  @ApiProperty({ enum: ORDER_TYPES }) type!: string;
  @ApiProperty({ example: 10 }) size!: number;
  @ApiProperty({ example: '925.85' }) price!: string;
  @ApiProperty({ enum: ['NEW', 'FILLED', 'REJECTED', 'CANCELLED'] }) status!: string;
  @ApiPropertyOptional({ enum: ['INSUFFICIENT_FUNDS', 'INSUFFICIENT_SHARES'], nullable: true, type: String })
  rejectionReason!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
