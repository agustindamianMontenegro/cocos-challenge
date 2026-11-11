import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BalanceResponseDto } from './balance.response.dto';
import { PositionResponseDto } from './position.response.dto';

export class PortfolioResponseDto {
  @ApiProperty({ example: 1 }) userId!: number;
  @ApiProperty({ example: '10001' }) accountNumber!: string;
  @ApiPropertyOptional({ example: '888940.00', nullable: true, type: String }) totalValue!: string | null;
  @ApiProperty({ example: true }) valuationComplete!: boolean;
  @ApiProperty({ type: BalanceResponseDto }) balance!: BalanceResponseDto;
  @ApiProperty({ type: PositionResponseDto, isArray: true }) positions!: PositionResponseDto[];
}
