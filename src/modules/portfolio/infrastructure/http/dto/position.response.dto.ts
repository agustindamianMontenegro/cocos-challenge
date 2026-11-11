import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PositionResponseDto {
  @ApiProperty({ example: 47 }) instrumentId!: number;
  @ApiProperty({ example: 'PAMP' }) ticker!: string;
  @ApiProperty({ example: 'Pampa Holding S.A.' }) name!: string;
  @ApiProperty({ example: 40 }) quantity!: number;
  @ApiProperty({ example: '930.00' }) averagePrice!: string;
  @ApiPropertyOptional({ example: '925.85', nullable: true, type: String }) lastPrice!: string | null;
  @ApiPropertyOptional({ example: '37034.00', nullable: true, type: String }) marketValue!: string | null;
  @ApiPropertyOptional({ example: '-0.45', nullable: true, type: String }) totalReturnPct!: string | null;
  @ApiPropertyOptional({ example: '0.44', nullable: true, type: String }) dailyReturnPct!: string | null;
}
