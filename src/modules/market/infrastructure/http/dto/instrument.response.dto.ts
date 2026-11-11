import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InstrumentResponseDto {
  @ApiProperty({ example: 50 }) id!: number;
  @ApiProperty({ example: 'YPFD' }) ticker!: string;
  @ApiProperty({ example: 'Y.P.F. S.A.' }) name!: string;
  @ApiProperty({ example: 'ACCIONES' }) type!: string;
  @ApiPropertyOptional({ example: '7837.50', nullable: true, type: String }) lastPrice!: string | null;
  @ApiPropertyOptional({ example: '7975.05', nullable: true, type: String }) previousClose!: string | null;
  @ApiPropertyOptional({ example: '-1.72', nullable: true, type: String }) dailyReturnPct!: string | null;
}
